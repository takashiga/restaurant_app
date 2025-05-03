# データベーススキーマ設計

## 概要

本文書では、日本のレストラン情報アプリケーションのためのデータベーススキーマを設計します。データポイントの優先順位と取得方法に基づき、効率的かつスケーラブルなデータ構造を定義します。

## データベース選択

アプリケーションの要件と制約を考慮し、以下の理由からSQLiteデータベースを選択します：

1. **開発の容易さ**: ファイルベースのデータベースであり、セットアップが簡単
2. **ポータビリティ**: 単一のファイルとして配布可能
3. **依存関係の少なさ**: 外部データベースサーバーが不要
4. **十分なパフォーマンス**: 中規模のデータセットに対して適切なパフォーマンスを提供
5. **プロトタイプに適している**: 初期開発とプロトタイピングに最適

本アプリケーションはプロトタイプ/プルーフオブコンセプトとして開発されるため、SQLiteは適切な選択です。将来的にスケーリングが必要になった場合は、PostgreSQLなどのより堅牢なデータベースに移行することも検討できます。

## スキーマ設計

### 主要エンティティ

#### 1. Restaurants（レストラン）

レストランの基本情報を格納するメインテーブル。

```sql
CREATE TABLE restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                     -- 店舗名（優先度1）
    address TEXT NOT NULL,                  -- 住所（優先度1）
    latitude REAL,                          -- 緯度（優先度4）
    longitude REAL,                         -- 経度（優先度4）
    phone_number TEXT,                      -- 電話番号（優先度4）
    website_url TEXT,                       -- ウェブサイトURL（優先度4）
    price_range_lunch_min INTEGER,          -- 昼食の最低価格（優先度2）
    price_range_lunch_max INTEGER,          -- 昼食の最高価格（優先度2）
    price_range_dinner_min INTEGER,         -- 夕食の最低価格（優先度2）
    price_range_dinner_max INTEGER,         -- 夕食の最高価格（優先度2）
    review_count INTEGER DEFAULT 0,         -- レビュー数（優先度5）
    average_rating REAL DEFAULT 0.0,        -- 平均評価（優先度5）
    data_source TEXT NOT NULL,              -- データソース（優先度3）
    source_id TEXT,                         -- ソースシステムでのID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 作成日時
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 更新日時（優先度3）
    UNIQUE(name, address)                   -- 店舗名と住所の組み合わせはユニーク
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER update_restaurants_timestamp 
AFTER UPDATE ON restaurants
FOR EACH ROW
BEGIN
    UPDATE restaurants SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 2. Cuisine Types（料理の種類）

料理の種類のマスターテーブル。

```sql
CREATE TABLE cuisine_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                     -- 料理の種類名（例：寿司、ラーメン）
    description TEXT,                       -- 説明
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER update_cuisine_types_timestamp 
AFTER UPDATE ON cuisine_types
FOR EACH ROW
BEGIN
    UPDATE cuisine_types SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 3. Restaurant Cuisine Types（レストランと料理の種類の関連）

レストランと料理の種類の多対多の関連を格納する中間テーブル。

```sql
CREATE TABLE restaurant_cuisine_types (
    restaurant_id INTEGER NOT NULL,
    cuisine_type_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (restaurant_id, cuisine_type_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (cuisine_type_id) REFERENCES cuisine_types(id) ON DELETE CASCADE
);
```

#### 4. Special Features（特別機能）

特別機能のマスターテーブル。

```sql
CREATE TABLE special_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                     -- 特別機能名（例：英語メニューあり）
    description TEXT,                       -- 説明
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER update_special_features_timestamp 
AFTER UPDATE ON special_features
FOR EACH ROW
BEGIN
    UPDATE special_features SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 5. Restaurant Special Features（レストランと特別機能の関連）

レストランと特別機能の多対多の関連を格納する中間テーブル。

```sql
CREATE TABLE restaurant_special_features (
    restaurant_id INTEGER NOT NULL,
    special_feature_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (restaurant_id, special_feature_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (special_feature_id) REFERENCES special_features(id) ON DELETE CASCADE
);
```

#### 6. Opening Hours（営業時間）

レストランの営業時間を格納するテーブル。

```sql
CREATE TABLE opening_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,           -- 曜日（0=日曜日, 1=月曜日, ..., 6=土曜日）
    open_time TEXT,                         -- 開店時間（HH:MM形式）
    close_time TEXT,                        -- 閉店時間（HH:MM形式）
    is_closed BOOLEAN DEFAULT FALSE,        -- 定休日かどうか
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    UNIQUE(restaurant_id, day_of_week)
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER update_opening_hours_timestamp 
AFTER UPDATE ON opening_hours
FOR EACH ROW
BEGIN
    UPDATE opening_hours SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 7. Photos（写真）

レストランの写真を格納するテーブル。

```sql
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    url TEXT NOT NULL,                      -- 写真のURL
    caption TEXT,                           -- キャプション
    source TEXT NOT NULL,                   -- 写真のソース
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER update_photos_timestamp 
AFTER UPDATE ON photos
FOR EACH ROW
BEGIN
    UPDATE photos SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 8. Reviews（レビュー）

レストランのレビューを格納するテーブル。

```sql
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    rating REAL NOT NULL,                   -- 評価（1-5）
    comment TEXT,                           -- コメント
    author TEXT,                            -- 著者
    source TEXT NOT NULL,                   -- レビューのソース
    source_id TEXT,                         -- ソースシステムでのID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER update_reviews_timestamp 
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    UPDATE reviews SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 9. Areas（エリア）

地域情報を格納するマスターテーブル。

```sql
CREATE TABLE areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                     -- エリア名（例：渋谷、新宿）
    prefecture TEXT NOT NULL,               -- 都道府県
    city TEXT,                              -- 市区町村
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, prefecture)
);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER update_areas_timestamp 
AFTER UPDATE ON areas
FOR EACH ROW
BEGIN
    UPDATE areas SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 10. Restaurant Areas（レストランとエリアの関連）

レストランとエリアの関連を格納するテーブル。

```sql
CREATE TABLE restaurant_areas (
    restaurant_id INTEGER NOT NULL,
    area_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (restaurant_id, area_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
);
```

### インデックス

パフォーマンスを向上させるために、以下のインデックスを作成します。

```sql
-- レストラン名による検索を高速化
CREATE INDEX idx_restaurants_name ON restaurants(name);

-- 住所による検索を高速化
CREATE INDEX idx_restaurants_address ON restaurants(address);

-- 緯度・経度による検索を高速化
CREATE INDEX idx_restaurants_coordinates ON restaurants(latitude, longitude);

-- 価格帯による検索を高速化
CREATE INDEX idx_restaurants_price_lunch ON restaurants(price_range_lunch_min, price_range_lunch_max);
CREATE INDEX idx_restaurants_price_dinner ON restaurants(price_range_dinner_min, price_range_dinner_max);

-- 評価による検索を高速化
CREATE INDEX idx_restaurants_rating ON restaurants(average_rating);

-- データソースによる検索を高速化
CREATE INDEX idx_restaurants_data_source ON restaurants(data_source);

-- 更新日時による検索を高速化
CREATE INDEX idx_restaurants_updated_at ON restaurants(updated_at);
```

## エンティティ関連図（ER図）

```
+----------------+       +-------------------+       +---------------+
| restaurants    |       | restaurant_       |       | cuisine_types |
|                |       | cuisine_types     |       |               |
| id             |<----->| restaurant_id     |<----->| id            |
| name           |       | cuisine_type_id   |       | name          |
| address        |       +-------------------+       | description   |
| latitude       |                                   +---------------+
| longitude      |
| phone_number   |       +-------------------+       +----------------+
| website_url    |       | restaurant_       |       | special_       |
| price_range_*  |       | special_features  |       | features       |
| review_count   |<----->| restaurant_id     |<----->| id             |
| average_rating |       | special_feature_id|       | name           |
| data_source    |       +-------------------+       | description    |
| source_id      |                                   +----------------+
| created_at     |
| updated_at     |       +-------------------+
+----------------+       | opening_hours     |
        ^                |                   |
        |                | id                |
        |                | restaurant_id     |
        +--------------->| day_of_week       |
        |                | open_time         |
        |                | close_time        |
        |                | is_closed         |
        |                +-------------------+
        |
        |                +-------------------+
        |                | photos            |
        |                |                   |
        +--------------->| id                |
        |                | restaurant_id     |
        |                | url               |
        |                | caption           |
        |                | source            |
        |                +-------------------+
        |
        |                +-------------------+
        |                | reviews           |
        |                |                   |
        +--------------->| id                |
        |                | restaurant_id     |
        |                | rating            |
        |                | comment           |
        |                | author            |
        |                | source            |
        |                +-------------------+
        |
        |                +-------------------+       +---------------+
        |                | restaurant_areas  |       | areas         |
        |                |                   |       |               |
        +--------------->| restaurant_id     |<----->| id            |
                         | area_id           |       | name          |
                         +-------------------+       | prefecture    |
                                                     | city          |
                                                     +---------------+
```

## データアクセスパターン

アプリケーションの主要なデータアクセスパターンと、それに対応するSQLクエリの例を示します。

### 1. レストランの検索

#### 名前による検索

```sql
SELECT r.* FROM restaurants r
WHERE r.name LIKE '%寿司%'
ORDER BY r.average_rating DESC
LIMIT 20;
```

#### 料理の種類による検索

```sql
SELECT r.* FROM restaurants r
JOIN restaurant_cuisine_types rct ON r.id = rct.restaurant_id
JOIN cuisine_types ct ON rct.cuisine_type_id = ct.id
WHERE ct.name = '寿司'
ORDER BY r.average_rating DESC
LIMIT 20;
```

#### 場所（エリア）による検索

```sql
SELECT r.* FROM restaurants r
JOIN restaurant_areas ra ON r.id = ra.restaurant_id
JOIN areas a ON ra.area_id = a.id
WHERE a.name = '渋谷'
ORDER BY r.average_rating DESC
LIMIT 20;
```

#### 価格帯によるフィルタリング

```sql
SELECT r.* FROM restaurants r
WHERE r.price_range_dinner_min <= 3000 AND r.price_range_dinner_max >= 3000
ORDER BY r.average_rating DESC
LIMIT 20;
```

#### 特別機能によるフィルタリング

```sql
SELECT r.* FROM restaurants r
JOIN restaurant_special_features rsf ON r.id = rsf.restaurant_id
JOIN special_features sf ON rsf.special_feature_id = sf.id
WHERE sf.name = '英語メニューあり'
ORDER BY r.average_rating DESC
LIMIT 20;
```

### 2. レストラン詳細の取得

```sql
-- レストラン基本情報
SELECT r.* FROM restaurants r WHERE r.id = ?;

-- 料理の種類
SELECT ct.* FROM cuisine_types ct
JOIN restaurant_cuisine_types rct ON ct.id = rct.cuisine_type_id
WHERE rct.restaurant_id = ?;

-- 特別機能
SELECT sf.* FROM special_features sf
JOIN restaurant_special_features rsf ON sf.id = rsf.special_feature_id
WHERE rsf.restaurant_id = ?;

-- 営業時間
SELECT oh.* FROM opening_hours oh
WHERE oh.restaurant_id = ?
ORDER BY oh.day_of_week;

-- 写真
SELECT p.* FROM photos p
WHERE p.restaurant_id = ?
ORDER BY p.created_at DESC;

-- レビュー
SELECT rv.* FROM reviews rv
WHERE rv.restaurant_id = ?
ORDER BY rv.created_at DESC
LIMIT 10;
```

### 3. 近くのレストランを検索

```sql
SELECT r.*, 
       (6371 * acos(cos(radians(?)) * cos(radians(r.latitude)) * 
       cos(radians(r.longitude) - radians(?)) + 
       sin(radians(?)) * sin(radians(r.latitude)))) AS distance
FROM restaurants r
HAVING distance < 2  -- 2km以内
ORDER BY distance
LIMIT 20;
```

## データ移行と初期化

データベースの初期化とデータ移行のためのスクリプトを提供します。

### 初期化スクリプト

```python
import sqlite3
import os

def initialize_database(db_path):
    """データベースを初期化し、必要なテーブルとインデックスを作成します。"""
    
    # データベースファイルが既に存在する場合は削除
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # データベースに接続
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # テーブルの作成
    # restaurants テーブル
    cursor.execute('''
    CREATE TABLE restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        phone_number TEXT,
        website_url TEXT,
        price_range_lunch_min INTEGER,
        price_range_lunch_max INTEGER,
        price_range_dinner_min INTEGER,
        price_range_dinner_max INTEGER,
        review_count INTEGER DEFAULT 0,
        average_rating REAL DEFAULT 0.0,
        data_source TEXT NOT NULL,
        source_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, address)
    )
    ''')
    
    # 更新時にupdated_atを自動更新するトリガー
    cursor.execute('''
    CREATE TRIGGER update_restaurants_timestamp 
    AFTER UPDATE ON restaurants
    FOR EACH ROW
    BEGIN
        UPDATE restaurants SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
    ''')
    
    # 他のテーブルとインデックスの作成（省略）
    # ...
    
    # コミットして接続を閉じる
    conn.commit()
    conn.close()
    
    print(f"Database initialized at {db_path}")

if __name__ == "__main__":
    db_path = "restaurant_app.db"
    initialize_database(db_path)
```

### データ移行スクリプト

```python
import sqlite3
import json
import os
from datetime import datetime

def migrate_data(db_path, data_file):
    """JSONデータをデータベースに移行します。"""
    
    # データベースに接続
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # JSONデータを読み込む
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # レストランデータの挿入
    for restaurant in data:
        # restaurants テーブルに挿入
        cursor.execute('''
        INSERT INTO restaurants (
            name, address, latitude, longitude, phone_number, website_url,
            price_range_lunch_min, price_range_lunch_max,
            price_range_dinner_min, price_range_dinner_max,
            data_source, source_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            restaurant['name'],
            restaurant['address'],
            restaurant.get('latitude'),
            restaurant.get('longitude'),
            restaurant.get('phone_number'),
            restaurant.get('website_url'),
            restaurant.get('price_range_lunch_min'),
            restaurant.get('price_range_lunch_max'),
            restaurant.get('price_range_dinner_min'),
            restaurant.get('price_range_dinner_max'),
            restaurant['data_source'],
            restaurant.get('source_id')
        ))
        
        restaurant_id = cursor.lastrowid
        
        # 料理の種類の挿入
        for cuisine_type in restaurant.get('cuisine_types', []):
            # cuisine_types テーブルに挿入（存在しない場合のみ）
            cursor.execute('''
            INSERT OR IGNORE INTO cuisine_types (name)
            VALUES (?)
            ''', (cuisine_type,))
            
            # cuisine_type_id を取得
            cursor.execute('''
            SELECT id FROM cuisine_types WHERE name = ?
            ''', (cuisine_type,))
            cuisine_type_id = cursor.fetchone()[0]
            
            # restaurant_cuisine_types テーブルに挿入
            cursor.execute('''
            INSERT INTO restaurant_cuisine_types (restaurant_id, cuisine_type_id)
            VALUES (?, ?)
            ''', (restaurant_id, cuisine_type_id))
        
        # 他のデータの挿入（省略）
        # ...
    
    # コミットして接続を閉じる
    conn.commit()
    conn.close()
    
    print(f"Data migrated to {db_path}")

if __name__ == "__main__":
    db_path = "restaurant_app.db"
    data_file = "restaurant_data.json"
    migrate_data(db_path, data_file)
```

## スケーラビリティと保守性

### スケーラビリティの考慮事項

1. **インデックス最適化**: 頻繁に使用されるクエリのパフォーマンスを向上させるために、適切なインデックスを作成しています。
2. **正規化**: データの重複を避けるために、適切に正規化されたスキーマを設計しています。
3. **将来の拡張性**: 新しいデータポイントや機能を追加するために、スキーマを拡張できるように設計しています。

### 保守性の考慮事項

1. **明確な命名規則**: テーブルとカラムの名前は、その目的を明確に示すように命名しています。
2. **外部キー制約**: データの整合性を確保するために、適切な外部キー制約を設定しています。
3. **タイムスタンプ**: すべてのレコードに作成日時と更新日時を記録し、データの鮮度を追跡できるようにしています。
4. **トリガー**: 更新時に自動的にタイムスタンプを更新するトリガーを実装しています。

## 結論

本文書では、日本のレストラン情報アプリケーションのためのデータベーススキーマを設計しました。SQLiteデータベースを使用し、レストラン情報を効率的に保存・管理するための構造を定義しました。スキーマは、データポイントの優先順位と取得方法に基づいて設計され、スケーラビリティと保守性を考慮しています。

次のステップとして、アプリケーションアーキテクチャの設計を行い、このデータベーススキーマを活用するためのバックエンドとフロントエンドの構造を定義します。
