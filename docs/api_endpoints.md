# APIエンドポイント詳細設計

## 概要

本文書では、日本のレストラン情報アプリケーションのためのAPIエンドポイントを詳細に設計します。アプリケーションアーキテクチャに基づき、フロントエンドとバックエンドの通信に必要なインターフェースを定義します。

## 基本情報

- **ベースURL**: `/api/v1`
- **レスポンス形式**: JSON
- **認証方式**: なし（公開API）
- **エラーハンドリング**: 標準HTTPステータスコードとエラーメッセージ

## 共通レスポンス形式

### 成功レスポンス

```json
{
  "status": "success",
  "data": {
    // レスポンスデータ
  }
}
```

### エラーレスポンス

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

## エンドポイント詳細

### 1. レストラン関連エンドポイント

#### 1.1 レストラン一覧取得

- **エンドポイント**: `/restaurants`
- **メソッド**: GET
- **説明**: レストランのリストを取得します。
- **クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `name` | string | いいえ | レストラン名で検索 |
| `cuisine_type` | string | いいえ | 料理の種類で検索 |
| `area` | string | いいえ | エリア名で検索 |
| `min_price` | integer | いいえ | 最低価格 |
| `max_price` | integer | いいえ | 最高価格 |
| `special_feature` | string | いいえ | 特別機能で検索 |
| `latitude` | float | いいえ | 緯度 |
| `longitude` | float | いいえ | 経度 |
| `radius` | float | いいえ | 検索半径（km） |
| `limit` | integer | いいえ | 取得件数（デフォルト: 20） |
| `offset` | integer | いいえ | オフセット（デフォルト: 0） |

- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "total": 100,
    "restaurants": [
      {
        "id": 1,
        "name": "寿司 太郎",
        "address": "東京都渋谷区渋谷1-1-1",
        "latitude": 35.6812,
        "longitude": 139.7671,
        "cuisine_types": [
          {
            "id": 1,
            "name": "寿司"
          }
        ],
        "price_range_dinner_min": 3000,
        "price_range_dinner_max": 10000,
        "average_rating": 4.5
      },
      // 他のレストラン
    ]
  }
}
```

- **エラーレスポンス**:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "無効なパラメータが指定されました。"
  }
}
```

#### 1.2 レストラン詳細取得

- **エンドポイント**: `/restaurants/{restaurant_id}`
- **メソッド**: GET
- **説明**: 特定のレストランの詳細情報を取得します。
- **パスパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `restaurant_id` | integer | はい | レストランID |

- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "寿司 太郎",
    "address": "東京都渋谷区渋谷1-1-1",
    "latitude": 35.6812,
    "longitude": 139.7671,
    "phone_number": "03-1234-5678",
    "website_url": "https://example.com/sushi-taro",
    "price_range_lunch_min": 1000,
    "price_range_lunch_max": 3000,
    "price_range_dinner_min": 3000,
    "price_range_dinner_max": 10000,
    "review_count": 120,
    "average_rating": 4.5,
    "cuisine_types": [
      {
        "id": 1,
        "name": "寿司"
      }
    ],
    "special_features": [
      {
        "id": 1,
        "name": "英語メニューあり"
      },
      {
        "id": 5,
        "name": "個室あり"
      }
    ],
    "areas": [
      {
        "id": 1,
        "name": "渋谷",
        "prefecture": "東京都",
        "city": "渋谷区"
      }
    ],
    "opening_hours": [
      {
        "day_of_week": 0,
        "open_time": "11:30",
        "close_time": "22:00",
        "is_closed": false
      },
      {
        "day_of_week": 1,
        "open_time": "11:30",
        "close_time": "22:00",
        "is_closed": false
      },
      // 他の曜日
    ],
    "photos": [
      {
        "id": 1,
        "url": "https://example.com/photos/sushi-taro-1.jpg",
        "caption": "店内の様子"
      },
      // 他の写真
    ],
    "reviews": [
      {
        "id": 1,
        "rating": 5.0,
        "comment": "とても美味しかったです。",
        "author": "田中太郎",
        "created_at": "2023-01-01T12:00:00Z"
      },
      // 他のレビュー
    ],
    "data_source": "hotpepper",
    "updated_at": "2023-01-01T12:00:00Z"
  }
}
```

- **エラーレスポンス**:

```json
{
  "status": "error",
  "error": {
    "code": "RESTAURANT_NOT_FOUND",
    "message": "指定されたIDのレストランが見つかりません。"
  }
}
```

#### 1.3 レストラン検索

- **エンドポイント**: `/restaurants/search`
- **メソッド**: GET
- **説明**: キーワードでレストランを検索します。
- **クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `q` | string | はい | 検索キーワード |
| `limit` | integer | いいえ | 取得件数（デフォルト: 20） |
| `offset` | integer | いいえ | オフセット（デフォルト: 0） |

- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "total": 50,
    "restaurants": [
      // レストランのリスト（1.1と同じ形式）
    ]
  }
}
```

#### 1.4 近くのレストラン取得

- **エンドポイント**: `/restaurants/nearby`
- **メソッド**: GET
- **説明**: 指定された位置の近くにあるレストランを取得します。
- **クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `latitude` | float | はい | 緯度 |
| `longitude` | float | はい | 経度 |
| `radius` | float | いいえ | 検索半径（km、デフォルト: 2） |
| `limit` | integer | いいえ | 取得件数（デフォルト: 20） |

- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "total": 15,
    "restaurants": [
      {
        // レストラン情報（1.1と同じ形式）
        "distance": 0.5 // 距離（km）
      },
      // 他のレストラン
    ]
  }
}
```

### 2. マスターデータ関連エンドポイント

#### 2.1 料理の種類一覧取得

- **エンドポイント**: `/cuisine-types`
- **メソッド**: GET
- **説明**: 料理の種類のリストを取得します。
- **クエリパラメータ**: なし
- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "cuisine_types": [
      {
        "id": 1,
        "name": "寿司"
      },
      {
        "id": 2,
        "name": "ラーメン"
      },
      // 他の料理の種類
    ]
  }
}
```

#### 2.2 特別機能一覧取得

- **エンドポイント**: `/special-features`
- **メソッド**: GET
- **説明**: 特別機能のリストを取得します。
- **クエリパラメータ**: なし
- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "special_features": [
      {
        "id": 1,
        "name": "英語メニューあり"
      },
      {
        "id": 2,
        "name": "ハラル対応"
      },
      // 他の特別機能
    ]
  }
}
```

#### 2.3 エリア一覧取得

- **エンドポイント**: `/areas`
- **メソッド**: GET
- **説明**: エリアのリストを取得します。
- **クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `prefecture` | string | いいえ | 都道府県名でフィルタリング |

- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "areas": [
      {
        "id": 1,
        "name": "渋谷",
        "prefecture": "東京都",
        "city": "渋谷区"
      },
      {
        "id": 2,
        "name": "新宿",
        "prefecture": "東京都",
        "city": "新宿区"
      },
      // 他のエリア
    ]
  }
}
```

### 3. データ更新関連エンドポイント

#### 3.1 データ取得

- **エンドポイント**: `/data/fetch`
- **メソッド**: POST
- **説明**: 特定のエリアのデータを外部APIから取得します。
- **リクエストボディ**:

```json
{
  "area_code": "Z011",  // HotPepper APIのエリアコード
  "source": "hotpepper" // データソース（"hotpepper", "yahoo", "google"）
}
```

- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "fetched_count": 100,
    "new_count": 80,
    "updated_count": 20,
    "area": "渋谷",
    "source": "hotpepper"
  }
}
```

- **エラーレスポンス**:

```json
{
  "status": "error",
  "error": {
    "code": "API_ERROR",
    "message": "外部APIからのデータ取得に失敗しました。"
  }
}
```

#### 3.2 データ更新

- **エンドポイント**: `/data/update`
- **メソッド**: POST
- **説明**: 既存のデータを更新します。
- **リクエストボディ**:

```json
{
  "source": "hotpepper",
  "last_updated_before": "2023-01-01T00:00:00Z" // この日時より前に更新されたデータを更新
}
```

- **レスポンス**:

```json
{
  "status": "success",
  "data": {
    "updated_count": 50,
    "source": "hotpepper"
  }
}
```

## エラーコード一覧

| エラーコード | HTTPステータス | 説明 |
|------------|--------------|------|
| `INVALID_PARAMETERS` | 400 | 無効なパラメータが指定されました。 |
| `RESTAURANT_NOT_FOUND` | 404 | 指定されたIDのレストランが見つかりません。 |
| `API_ERROR` | 500 | 外部APIとの通信中にエラーが発生しました。 |
| `DATABASE_ERROR` | 500 | データベース操作中にエラーが発生しました。 |
| `INTERNAL_SERVER_ERROR` | 500 | サーバー内部でエラーが発生しました。 |

## APIの使用例

### cURLを使用した例

#### レストラン一覧の取得

```bash
curl -X GET "http://localhost:8000/api/v1/restaurants?cuisine_type=寿司&limit=5"
```

#### レストラン詳細の取得

```bash
curl -X GET "http://localhost:8000/api/v1/restaurants/1"
```

#### キーワード検索

```bash
curl -X GET "http://localhost:8000/api/v1/restaurants/search?q=寿司&limit=5"
```

#### 近くのレストラン取得

```bash
curl -X GET "http://localhost:8000/api/v1/restaurants/nearby?latitude=35.6812&longitude=139.7671&radius=1"
```

### JavaScriptを使用した例

#### レストラン一覧の取得

```javascript
async function getRestaurants() {
  try {
    const response = await fetch('http://localhost:8000/api/v1/restaurants?cuisine_type=寿司&limit=5');
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('レストラン一覧:', data.data.restaurants);
    } else {
      console.error('エラー:', data.error.message);
    }
  } catch (error) {
    console.error('APIリクエストエラー:', error);
  }
}
```

#### レストラン詳細の取得

```javascript
async function getRestaurantDetails(id) {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/restaurants/${id}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('レストラン詳細:', data.data);
    } else {
      console.error('エラー:', data.error.message);
    }
  } catch (error) {
    console.error('APIリクエストエラー:', error);
  }
}
```

## CORS設定

APIはCORS（Cross-Origin Resource Sharing）を有効にし、フロントエンドからのリクエストを許可します。

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切なオリジンに制限すべき
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## レート制限

APIには以下のレート制限を設定します：

- 匿名ユーザー: 1分あたり60リクエスト
- IPアドレスごと: 1分あたり100リクエスト

```python
from fastapi import FastAPI, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/v1/restaurants")
@limiter.limit("60/minute")
async def get_restaurants(request: Request):
    # 実装
    pass
```

## キャッシュ戦略

パフォーマンスを向上させるために、以下のキャッシュ戦略を実装します：

1. **レストラン一覧**: 5分間キャッシュ
2. **レストラン詳細**: 1時間キャッシュ
3. **マスターデータ**: 24時間キャッシュ

```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@app.get("/api/v1/restaurants")
@cache(expire=300)  # 5分間キャッシュ
async def get_restaurants():
    # 実装
    pass

@app.get("/api/v1/restaurants/{restaurant_id}")
@cache(expire=3600)  # 1時間キャッシュ
async def get_restaurant(restaurant_id: int):
    # 実装
    pass

@app.get("/api/v1/cuisine-types")
@cache(expire=86400)  # 24時間キャッシュ
async def get_cuisine_types():
    # 実装
    pass
```

## API実装計画

APIの実装は以下の順序で行います：

1. **基本設定**: FastAPIアプリケーションの設定、CORSの有効化
2. **データベース接続**: SQLAlchemyを使用したデータベース接続の設定
3. **モデル定義**: SQLAlchemyモデルとPydanticスキーマの定義
4. **基本エンドポイント**: レストラン一覧、詳細取得の実装
5. **検索エンドポイント**: 検索、近くのレストラン取得の実装
6. **マスターデータエンドポイント**: 料理の種類、特別機能、エリアの取得
7. **データ更新エンドポイント**: データ取得、更新の実装
8. **エラーハンドリング**: 例外処理とエラーレスポンスの実装
9. **パフォーマンス最適化**: キャッシュ、レート制限の実装
10. **テスト**: ユニットテスト、統合テストの実装

## 結論

本文書では、日本のレストラン情報アプリケーションのためのAPIエンドポイントを詳細に設計しました。レストラン情報の取得、検索、フィルタリングに必要なエンドポイントを定義し、リクエスト/レスポンス形式、エラーハンドリング、使用例を提供しました。また、CORS設定、レート制限、キャッシュ戦略についても検討し、APIの実装計画を示しました。

次のステップとして、技術スタックの選定と詳細な実装計画を行います。
