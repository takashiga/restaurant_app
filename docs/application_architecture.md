# アプリケーションアーキテクチャ設計

## 概要

本文書では、日本のレストラン情報アプリケーションのためのアーキテクチャを設計します。要件分析、データソース調査、データ取得戦略、およびデータベーススキーマに基づき、効率的かつスケーラブルなアプリケーション構造を定義します。

## アーキテクチャの概要

アプリケーションは、以下の主要コンポーネントで構成される3層アーキテクチャを採用します：

1. **データ層**：データの取得、保存、管理を担当
2. **ビジネスロジック層**：アプリケーションのコアロジックを実装
3. **プレゼンテーション層**：ユーザーインターフェースを提供

これらの層は明確に分離され、各層は特定の責任を持ち、他の層との依存関係を最小限に抑えます。

### 全体アーキテクチャ図

```
+----------------------------------+
|        プレゼンテーション層        |
|                                  |
|  +----------------------------+  |
|  |      Reactフロントエンド     |  |
|  |                            |  |
|  |  +----------------------+  |  |
|  |  |   UIコンポーネント    |  |  |
|  |  +----------------------+  |  |
|  |  |   状態管理 (Redux)   |  |  |
|  |  +----------------------+  |  |
|  |  |   ルーティング       |  |  |
|  |  +----------------------+  |  |
|  +----------------------------+  |
+----------------------------------+
              |
              | HTTP/REST
              |
+----------------------------------+
|        ビジネスロジック層         |
|                                  |
|  +----------------------------+  |
|  |     FastAPI バックエンド    |  |
|  |                            |  |
|  |  +----------------------+  |  |
|  |  |   APIエンドポイント   |  |  |
|  |  +----------------------+  |  |
|  |  |   ビジネスロジック   |  |  |
|  |  +----------------------+  |  |
|  |  |   データアクセス     |  |  |
|  |  +----------------------+  |  |
|  +----------------------------+  |
+----------------------------------+
              |
              | SQL/ORM
              |
+----------------------------------+
|            データ層              |
|                                  |
|  +----------------------------+  |
|  |      SQLiteデータベース     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |      データ取得モジュール    |  |
|  |                            |  |
|  |  +----------------------+  |  |
|  |  | HotPepper API Client |  |  |
|  |  +----------------------+  |  |
|  |  | Yahoo API Client     |  |  |
|  |  +----------------------+  |  |
|  |  | Google API Client    |  |  |
|  |  +----------------------+  |  |
|  +----------------------------+  |
+----------------------------------+
```

## 技術スタックの選定

アプリケーションの要件と制約を考慮し、以下の技術スタックを選定します：

### バックエンド

- **言語**: Python 3.9+
- **Webフレームワーク**: FastAPI
  - 高速なパフォーマンス
  - 自動APIドキュメント生成
  - 型ヒントによる堅牢性
  - 非同期処理のサポート
- **ORM**: SQLAlchemy
  - 柔軟なデータベース操作
  - 型安全なクエリ構築
  - マイグレーションのサポート
- **データベース**: SQLite
  - 開発の容易さ
  - ポータビリティ
  - 依存関係の少なさ
- **APIクライアント**: Requests, aiohttp
  - 外部APIとの通信
  - 同期・非同期リクエストのサポート

### フロントエンド

- **言語**: TypeScript
- **フレームワーク**: React
  - コンポーネントベースのUI開発
  - 仮想DOMによる高速なレンダリング
  - 豊富なエコシステム
- **状態管理**: Redux Toolkit
  - 予測可能な状態管理
  - デバッグの容易さ
  - 非同期処理のサポート
- **UIライブラリ**: Material-UI
  - 美しく一貫性のあるUIコンポーネント
  - レスポンシブデザインのサポート
  - カスタマイズの柔軟性
- **地図ライブラリ**: Leaflet
  - 軽量で高速
  - モバイルフレンドリー
  - オープンソースの地図データ（OpenStreetMap）のサポート

### 開発ツール

- **パッケージ管理**: Poetry (Python), npm (JavaScript)
- **コード品質**: Black, isort, ESLint, Prettier
- **テスト**: Pytest, Jest
- **ドキュメント**: Sphinx, JSDoc

## コンポーネント設計

### データ層

#### データベース

SQLiteデータベースを使用し、`database_schema.md`で定義されたスキーマに基づいてデータを保存します。

#### データ取得モジュール

外部APIからデータを取得し、データベースに保存するモジュールです。

```python
# データ取得モジュールの概念的な構造
class DataFetcher:
    def __init__(self, config):
        self.hotpepper_client = HotPepperClient(config["hotpepper_api_key"])
        self.yahoo_client = YahooLocalSearchClient(config["yahoo_app_id"])
        self.google_client = GooglePlacesClient(config["google_api_key"])
        self.db = Database()
    
    async def fetch_and_store_restaurants(self, area_code):
        """指定されたエリアのレストラン情報を取得し、データベースに保存します。"""
        # HotPepper APIからデータ取得
        hotpepper_data = await self.hotpepper_client.search_restaurants(area=area_code)
        
        # データベースに保存
        for restaurant in hotpepper_data:
            self.db.save_restaurant(restaurant)
        
        # 必要に応じて他のAPIからも取得
        # ...
    
    async def update_restaurant_details(self, restaurant_id):
        """特定のレストランの詳細情報を更新します。"""
        # データベースからレストラン情報を取得
        restaurant = self.db.get_restaurant(restaurant_id)
        
        # 詳細情報を取得
        if restaurant["data_source"] == "hotpepper":
            details = await self.hotpepper_client.get_restaurant_details(restaurant["source_id"])
        elif restaurant["data_source"] == "yahoo":
            details = await self.yahoo_client.get_restaurant_details(restaurant["source_id"])
        
        # データベースを更新
        self.db.update_restaurant(restaurant_id, details)
```

#### APIクライアント

各外部APIと通信するためのクライアントクラスです。

```python
# HotPepper APIクライアント
class HotPepperClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "http://webservice.recruit.co.jp/hotpepper/gourmet/v1/"
    
    async def search_restaurants(self, **params):
        """レストランを検索します。"""
        params["key"] = self.api_key
        params["format"] = "json"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(self.base_url, params=params) as response:
                data = await response.json()
                return self._parse_restaurants(data)
    
    def _parse_restaurants(self, data):
        """APIレスポンスをパースします。"""
        restaurants = []
        for shop in data["results"]["shop"]:
            restaurant = {
                "name": shop["name"],
                "address": shop["address"],
                "latitude": float(shop["lat"]),
                "longitude": float(shop["lng"]),
                "phone_number": shop["tel"],
                "website_url": shop["urls"]["pc"],
                "price_range_lunch": self._parse_price_range(shop["budget"]["name"]),
                "price_range_dinner": self._parse_price_range(shop["budget"]["name"]),
                "cuisine_types": [genre["name"] for genre in shop["genre"]],
                "special_features": self._parse_special_features(shop),
                "data_source": "hotpepper",
                "source_id": shop["id"]
            }
            restaurants.append(restaurant)
        return restaurants
    
    def _parse_price_range(self, budget_name):
        """予算名から価格帯を解析します。"""
        # 実装省略
        pass
    
    def _parse_special_features(self, shop):
        """特別機能を解析します。"""
        # 実装省略
        pass
```

### ビジネスロジック層

#### APIエンドポイント

FastAPIを使用して、以下のAPIエンドポイントを実装します：

```python
from fastapi import FastAPI, Query, Path, Depends
from typing import List, Optional
from sqlalchemy.orm import Session

from .database import get_db
from .models import Restaurant, CuisineType, SpecialFeature
from .schemas import RestaurantResponse, RestaurantDetail

app = FastAPI(title="日本のレストラン情報API")

@app.get("/restaurants/", response_model=List[RestaurantResponse])
async def get_restaurants(
    db: Session = Depends(get_db),
    name: Optional[str] = Query(None, description="レストラン名で検索"),
    cuisine_type: Optional[str] = Query(None, description="料理の種類で検索"),
    area: Optional[str] = Query(None, description="エリア名で検索"),
    min_price: Optional[int] = Query(None, description="最低価格"),
    max_price: Optional[int] = Query(None, description="最高価格"),
    special_feature: Optional[str] = Query(None, description="特別機能で検索"),
    latitude: Optional[float] = Query(None, description="緯度"),
    longitude: Optional[float] = Query(None, description="経度"),
    radius: Optional[float] = Query(None, description="検索半径（km）"),
    limit: int = Query(20, description="取得件数"),
    offset: int = Query(0, description="オフセット")
):
    """レストランを検索します。"""
    # クエリパラメータに基づいてレストランを検索
    query = db.query(Restaurant)
    
    if name:
        query = query.filter(Restaurant.name.ilike(f"%{name}%"))
    
    if cuisine_type:
        query = query.join(Restaurant.cuisine_types).filter(CuisineType.name == cuisine_type)
    
    if area:
        query = query.join(Restaurant.areas).filter(Area.name == area)
    
    if min_price:
        query = query.filter(Restaurant.price_range_dinner_min >= min_price)
    
    if max_price:
        query = query.filter(Restaurant.price_range_dinner_max <= max_price)
    
    if special_feature:
        query = query.join(Restaurant.special_features).filter(SpecialFeature.name == special_feature)
    
    if latitude and longitude and radius:
        # 緯度・経度・半径に基づく検索（Haversine公式）
        # 実装省略
        pass
    
    restaurants = query.offset(offset).limit(limit).all()
    return restaurants

@app.get("/restaurants/{restaurant_id}", response_model=RestaurantDetail)
async def get_restaurant(
    restaurant_id: int = Path(..., description="レストランID"),
    db: Session = Depends(get_db)
):
    """レストランの詳細情報を取得します。"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

# その他のエンドポイント
# ...
```

#### データアクセス層

SQLAlchemyを使用して、データベースとのやり取りを行います：

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./restaurant_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### モデル

SQLAlchemyモデルを使用して、データベーススキーマを表現します：

```python
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

# 中間テーブル：レストランと料理の種類
restaurant_cuisine_types = Table(
    "restaurant_cuisine_types",
    Base.metadata,
    Column("restaurant_id", Integer, ForeignKey("restaurants.id"), primary_key=True),
    Column("cuisine_type_id", Integer, ForeignKey("cuisine_types.id"), primary_key=True),
    Column("created_at", DateTime, default=func.now())
)

# 中間テーブル：レストランと特別機能
restaurant_special_features = Table(
    "restaurant_special_features",
    Base.metadata,
    Column("restaurant_id", Integer, ForeignKey("restaurants.id"), primary_key=True),
    Column("special_feature_id", Integer, ForeignKey("special_features.id"), primary_key=True),
    Column("created_at", DateTime, default=func.now())
)

# 中間テーブル：レストランとエリア
restaurant_areas = Table(
    "restaurant_areas",
    Base.metadata,
    Column("restaurant_id", Integer, ForeignKey("restaurants.id"), primary_key=True),
    Column("area_id", Integer, ForeignKey("areas.id"), primary_key=True),
    Column("created_at", DateTime, default=func.now())
)

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    phone_number = Column(String)
    website_url = Column(String)
    price_range_lunch_min = Column(Integer)
    price_range_lunch_max = Column(Integer)
    price_range_dinner_min = Column(Integer)
    price_range_dinner_max = Column(Integer)
    review_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    data_source = Column(String, nullable=False)
    source_id = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # リレーションシップ
    cuisine_types = relationship("CuisineType", secondary=restaurant_cuisine_types, back_populates="restaurants")
    special_features = relationship("SpecialFeature", secondary=restaurant_special_features, back_populates="restaurants")
    areas = relationship("Area", secondary=restaurant_areas, back_populates="restaurants")
    opening_hours = relationship("OpeningHour", back_populates="restaurant")
    photos = relationship("Photo", back_populates="restaurant")
    reviews = relationship("Review", back_populates="restaurant")

# その他のモデル
# ...
```

#### スキーマ

Pydanticモデルを使用して、APIリクエスト/レスポンスのスキーマを定義します：

```python
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime

class CuisineTypeResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        orm_mode = True

class SpecialFeatureResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        orm_mode = True

class AreaResponse(BaseModel):
    id: int
    name: str
    prefecture: str
    city: Optional[str]
    
    class Config:
        orm_mode = True

class OpeningHourResponse(BaseModel):
    day_of_week: int
    open_time: Optional[str]
    close_time: Optional[str]
    is_closed: bool
    
    class Config:
        orm_mode = True

class PhotoResponse(BaseModel):
    id: int
    url: HttpUrl
    caption: Optional[str]
    
    class Config:
        orm_mode = True

class ReviewResponse(BaseModel):
    id: int
    rating: float
    comment: Optional[str]
    author: Optional[str]
    created_at: datetime
    
    class Config:
        orm_mode = True

class RestaurantResponse(BaseModel):
    id: int
    name: str
    address: str
    latitude: Optional[float]
    longitude: Optional[float]
    cuisine_types: List[CuisineTypeResponse]
    price_range_dinner_min: Optional[int]
    price_range_dinner_max: Optional[int]
    average_rating: float
    
    class Config:
        orm_mode = True

class RestaurantDetail(RestaurantResponse):
    phone_number: Optional[str]
    website_url: Optional[HttpUrl]
    price_range_lunch_min: Optional[int]
    price_range_lunch_max: Optional[int]
    review_count: int
    special_features: List[SpecialFeatureResponse]
    areas: List[AreaResponse]
    opening_hours: List[OpeningHourResponse]
    photos: List[PhotoResponse]
    reviews: List[ReviewResponse]
    data_source: str
    updated_at: datetime
    
    class Config:
        orm_mode = True
```

### プレゼンテーション層

#### コンポーネント構造

Reactを使用して、以下のコンポーネント構造を実装します：

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorMessage.tsx
│   ├── restaurants/
│   │   ├── RestaurantList.tsx
│   │   ├── RestaurantCard.tsx
│   │   ├── RestaurantDetail.tsx
│   │   ├── RestaurantMap.tsx
│   │   └── RestaurantFilter.tsx
│   └── search/
│       ├── SearchBar.tsx
│       ├── FilterPanel.tsx
│       └── SortOptions.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── SearchPage.tsx
│   ├── RestaurantDetailPage.tsx
│   └── NotFoundPage.tsx
├── store/
│   ├── index.ts
│   ├── restaurantsSlice.ts
│   ├── filtersSlice.ts
│   └── api.ts
├── utils/
│   ├── formatters.ts
│   └── mapUtils.ts
├── types/
│   └── index.ts
├── App.tsx
└── index.tsx
```

#### 状態管理

Redux Toolkitを使用して、アプリケーションの状態を管理します：

```typescript
// store/restaurantsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from './api';
import { Restaurant, RestaurantDetail } from '../types';

interface RestaurantsState {
  list: Restaurant[];
  selectedRestaurant: RestaurantDetail | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
}

const initialState: RestaurantsState = {
  list: [],
  selectedRestaurant: null,
  loading: false,
  error: null,
  totalCount: 0,
};

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (params: any) => {
    const response = await api.get('/restaurants', { params });
    return response.data;
  }
);

export const fetchRestaurantById = createAsyncThunk(
  'restaurants/fetchRestaurantById',
  async (id: number) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  }
);

const restaurantsSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    clearSelectedRestaurant: (state) => {
      state.selectedRestaurant = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.restaurants;
        state.totalCount = action.payload.total;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch restaurants';
      })
      .addCase(fetchRestaurantById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRestaurant = action.payload;
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch restaurant details';
      });
  },
});

export const { clearSelectedRestaurant } = restaurantsSlice.actions;
export default restaurantsSlice.reducer;
```

#### APIクライアント

Axiosを使用して、バックエンドAPIと通信します：

```typescript
// store/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### UIコンポーネント

Material-UIを使用して、UIコンポーネントを実装します：

```typescript
// components/restaurants/RestaurantCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Chip, Box, Rating } from '@mui/material';
import { Restaurant } from '../../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  return (
    <Card component={Link} to={`/restaurants/${restaurant.id}`} sx={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardMedia
        component="img"
        height="140"
        image={restaurant.photos?.[0]?.url || '/placeholder.jpg'}
        alt={restaurant.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div">
          {restaurant.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={restaurant.average_rating} readOnly size="small" precision={0.5} />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({restaurant.review_count})
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {restaurant.address}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {restaurant.cuisine_types.map((cuisine) => (
            <Chip key={cuisine.id} label={cuisine.name} size="small" />
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary">
          予算: {restaurant.price_range_dinner_min ? `¥${restaurant.price_range_dinner_min}〜¥${restaurant.price_range_dinner_max}` : '不明'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;
```

#### 地図コンポーネント

Leafletを使用して、地図コンポーネントを実装します：

```typescript
// components/restaurants/RestaurantMap.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper } from '@mui/material';
import { Restaurant } from '../../types';

// Leafletのデフォルトアイコンの問題を修正
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RestaurantMapProps {
  restaurants: Restaurant[];
  center?: [number, number];
  zoom?: number;
}

const RestaurantMap: React.FC<RestaurantMapProps> = ({ 
  restaurants, 
  center = [35.6812, 139.7671], // 東京駅をデフォルトの中心に
  zoom = 13 
}) => {
  return (
    <Paper elevation={3} sx={{ height: '500px', width: '100%' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {restaurants.map((restaurant) => (
          restaurant.latitude && restaurant.longitude ? (
            <Marker 
              key={restaurant.id} 
              position={[restaurant.latitude, restaurant.longitude]}
            >
              <Popup>
                <Box>
                  <strong>{restaurant.name}</strong>
                  <div>{restaurant.address}</div>
                  <div>
                    {restaurant.cuisine_types.map(cuisine => cuisine.name).join(', ')}
                  </div>
                </Box>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </Paper>
  );
};

export default RestaurantMap;
```

## APIエンドポイント設計

アプリケーションの主要なAPIエンドポイントを以下に定義します：

### レストラン関連エンドポイント

| エンドポイント | メソッド | 説明 | クエリパラメータ | レスポンス |
|--------------|--------|------|---------------|----------|
| `/restaurants/` | GET | レストランのリストを取得 | `name`, `cuisine_type`, `area`, `min_price`, `max_price`, `special_feature`, `latitude`, `longitude`, `radius`, `limit`, `offset` | レストランのリスト |
| `/restaurants/{id}` | GET | 特定のレストランの詳細を取得 | - | レストラン詳細 |
| `/restaurants/search` | GET | レストランを検索 | `q`（検索キーワード）, `limit`, `offset` | 検索結果のレストランリスト |
| `/restaurants/nearby` | GET | 近くのレストランを取得 | `latitude`, `longitude`, `radius`, `limit` | 近くのレストランリスト |

### マスターデータ関連エンドポイント

| エンドポイント | メソッド | 説明 | クエリパラメータ | レスポンス |
|--------------|--------|------|---------------|----------|
| `/cuisine-types/` | GET | 料理の種類のリストを取得 | - | 料理の種類のリスト |
| `/special-features/` | GET | 特別機能のリストを取得 | - | 特別機能のリスト |
| `/areas/` | GET | エリアのリストを取得 | `prefecture` | エリアのリスト |

### データ更新関連エンドポイント

| エンドポイント | メソッド | 説明 | クエリパラメータ | レスポンス |
|--------------|--------|------|---------------|----------|
| `/data/fetch` | POST | 特定のエリアのデータを取得 | `area_code` | 取得結果のサマリー |
| `/data/update` | POST | データを更新 | `source`, `last_updated_before` | 更新結果のサマリー |

## デプロイメント戦略

アプリケーションのデプロイメントには、以下の戦略を採用します：

### 開発環境

- **バックエンド**: ローカル開発サーバー（Uvicorn）
- **フロントエンド**: ローカル開発サーバー（Vite）
- **データベース**: SQLite（ファイルベース）

### 本番環境

- **バックエンド**: Fly.io（FastAPI）
- **フロントエンド**: Netlify（React）
- **データベース**: SQLite（初期段階）、PostgreSQL（スケーリング時）

### CI/CD

- **テスト**: GitHub Actions
- **デプロイ**: GitHub Actions + Fly.io + Netlify

## スケーラビリティと保守性

### スケーラビリティの考慮事項

1. **モジュール化**: アプリケーションは明確に分離されたモジュールで構成され、各モジュールは独立してスケールできます。
2. **非同期処理**: FastAPIの非同期処理を活用して、I/O集約型の操作を効率的に処理します。
3. **キャッシュ戦略**: 頻繁にアクセスされるデータをキャッシュして、データベースの負荷を軽減します。
4. **データベースの移行パス**: 初期段階ではSQLiteを使用し、スケーリングが必要になった場合はPostgreSQLに移行できるように設計します。

### 保守性の考慮事項

1. **明確なコード構造**: アプリケーションは明確な構造を持ち、各コンポーネントの責任が明確に定義されています。
2. **型安全性**: TypeScriptとPythonの型ヒントを活用して、型安全なコードを記述します。
3. **テスト**: ユニットテストと統合テストを実装して、コードの品質を確保します。
4. **ドキュメント**: コードとAPIのドキュメントを充実させ、開発者が容易に理解できるようにします。

## 結論

本文書では、日本のレストラン情報アプリケーションのためのアーキテクチャを設計しました。3層アーキテクチャを採用し、FastAPI（バックエンド）とReact（フロントエンド）を使用して、効率的かつスケーラブルなアプリケーションを構築します。データ取得、保存、表示の各層が明確に分離され、各層は特定の責任を持ち、他の層との依存関係を最小限に抑えます。

次のステップとして、APIエンドポイントの詳細設計を行い、バックエンドとフロントエンドの実装を進めます。
