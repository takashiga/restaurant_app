# グルメコンパス (Gourmet Compass)

日本のレストランを簡単に探索できる洗練されたプラットフォームです。グルメコンパスでは、レストランデータの収集、保存、表示を行い、ユーザーがレストラン情報を簡単に検索・フィルタリングできる機能を提供します。

## 機能

- レストランのリスト/マップ表示
- 名前、料理の種類、場所（エリア）による検索
- 価格帯や特別機能によるフィルタリング
- 選択したレストランの詳細情報の表示
- 現在地からの近くのレストラン検索

## 技術スタック

### バックエンド
- Python 3.12
- FastAPI
- SQLAlchemy (ORM)
- SQLite (開発環境)
- Pydantic
- Poetry (依存関係管理)

### フロントエンド
- TypeScript
- React
- Redux Toolkit
- Material-UI
- React Router
- Leaflet (地図表示)
- Vite (ビルドツール)

## プロジェクト構造

```
restaurant_app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── restaurants.py
│   │   │   │   └── hotpepper.py
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   └── init_db.py
│   │   ├── models/
│   │   │   └── restaurant.py
│   │   ├── schemas/
│   │   │   └── restaurant.py
│   │   ├── services/
│   │   │   ├── api/
│   │   │   │   └── hotpepper.py
│   │   │   ├── cache.py
│   │   │   └── data_acquisition.py
│   │   └── main.py
│   ├── pyproject.toml
│   ├── .env
│   ├── import_data.py
│   └── test_data_acquisition.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── RestaurantListPage.tsx
│   │   │   └── RestaurantDetailPage.tsx
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   └── services/
│   │   │       └── restaurantApi.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── docs/
    ├── data_sources_research.md
    ├── data_acquisition_strategy.md
    ├── legal_ethical_compliance.md
    └── api_endpoints.md
```

## セットアップ手順

### 前提条件
- Python 3.12以上
- Node.js 18以上
- npm または yarn

### バックエンドのセットアップ

1. リポジトリをクローン
```bash
git clone <repository-url>
cd restaurant_app/backend
```

2. 依存関係のインストール
```bash
poetry install
```

3. 環境変数の設定
`.env`ファイルをバックエンドディレクトリに作成し、以下の内容を追加します：

```
API_KEY_HOTPEPPER=8e3aa6382b00151e
API_URL_HOTPEPPER=https://webservice.recruit.co.jp/hotpepper/gourmet/v1/
DATABASE_URL=sqlite:///./restaurant_app.db
ENVIRONMENT=development
```

4. データベースの初期化とサンプルデータのインポート
```bash
poetry run python -m app.db.init_db
poetry run python import_data.py
```

5. サーバーを起動
```bash
poetry run uvicorn app.main:app --reload
```

### フロントエンドのセットアップ

1. フロントエンドディレクトリに移動
```bash
cd ../frontend
```

2. 依存関係のインストール
```bash
npm install
# または
yarn install
```

3. 環境変数の設定
`.env`ファイルをフロントエンドディレクトリに作成し、以下の内容を追加します：

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

4. 開発サーバーを起動
```bash
npm run dev -- --host
# または
yarn dev --host
```

## アプリケーションの使用方法

### レストラン一覧の表示
- グルメコンパスのホームページにアクセスすると、レストラン一覧ページへのリンクが表示されます
- レストラン一覧ページでは、登録されているレストランがカード形式で表示されます
- 各レストランカードには、店舗名、料理の種類、住所、価格帯、特別機能などの情報が表示されます

### レストランの検索とフィルタリング
- **フィルター検索**: 店舗名、料理の種類、エリアによる検索が可能です
- **価格帯フィルター**: スライダーを使用して価格帯でフィルタリングできます
- **特別機能**: 個室あり、禁煙、駐車場ありなどの特別機能でフィルタリングできます
- **現在地から検索**: 現在地ボタンをクリックすると、現在地周辺のレストランを検索できます

### マップ表示
- 「マップ」タブをクリックすると、レストランの位置が地図上に表示されます
- マーカーをクリックすると、レストランの基本情報がポップアップ表示されます
- 「詳細を見る」ボタンをクリックすると、レストランの詳細ページに移動します

### レストラン詳細の表示
- レストランカードまたはマップのポップアップから詳細ページにアクセスできます
- 詳細ページでは、レストランの基本情報、特徴、地図などが表示されます

## APIエンドポイント

### レストラン関連

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|--------|------|----------|
| `/api/v1/restaurants/` | GET | レストラン一覧の取得 | `name`, `cuisine_type`, `area`, `min_price`, `max_price`, `special_feature`, `skip`, `limit` |
| `/api/v1/restaurants/{id}/` | GET | 特定のレストラン情報の取得 | `id`: レストランID |
| `/api/v1/restaurants/search/` | GET | キーワードによるレストラン検索 | `q`: 検索キーワード, `skip`, `limit` |
| `/api/v1/restaurants/nearby/` | GET | 現在地周辺のレストラン検索 | `latitude`, `longitude`, `radius`, `limit` |
| `/api/v1/restaurants/cuisine-types/` | GET | 料理の種類一覧の取得 | なし |
| `/api/v1/restaurants/special-features/` | GET | 特別機能一覧の取得 | なし |

### HotPepper API関連

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|--------|------|----------|
| `/api/v1/hotpepper/test-connection/` | GET | HotPepper APIの接続テスト | なし |
| `/api/v1/hotpepper/import/` | POST | HotPepper APIからのデータインポート | `keyword`: 検索キーワード, `count`: インポート件数 |

## データソース

このアプリケーションは、以下のデータソースを使用しています：

- **HotPepper API** (リクルート社提供)
  - 利用規約に従い、データソースとしてHotPepper/リクルートを明示的に表示しています
  - APIキー: `8e3aa6382b00151e` (メールアドレス：takahiro.shiga.810@gmail.com)
  - 個人利用のみを目的としています

## 法的・倫理的コンプライアンス

### データ取得の合法性
- すべてのデータ取得は、提供元の利用規約に準拠しています
- HotPepper APIの利用規約に従い、データソースとしてHotPepper/リクルートを明示的に表示しています
- APIレート制限を尊重し、過度のリクエストを防ぐためのキャッシュ機構を実装しています

### データ保存と処理
- 取得したデータには、ソースとタイムスタンプを明確に記録しています
- 個人情報は収集・保存していません
- データは研究・教育目的のみに使用しています

## テスト

### バックエンドテストの実行
```bash
cd backend
poetry run pytest
```

テストには以下が含まれています：
- HotPepper API接続テスト
- データ取得・変換テスト
- APIエンドポイントテスト

## トラブルシューティング

### よくある問題と解決策

1. **バックエンドサーバーに接続できない**
   - ポート8000が他のアプリケーションで使用されていないか確認してください
   - 環境変数が正しく設定されているか確認してください

2. **グルメコンパスが正しく表示されない**
   - ブラウザのコンソールでエラーを確認してください
   - `.env`ファイルでAPIのベースURLが正しく設定されているか確認してください

3. **マップが表示されない**
   - インターネット接続を確認してください
   - ブラウザの位置情報サービスが有効になっているか確認してください

## ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。

## 謝辞

- HotPepper API / リクルート社提供のデータを使用しています
- OpenStreetMapの地図データを使用しています
