# ksj-roadcenterline-viewer

国土数値情報（KSJ）道路中心線データを MapLibre GL JS + PMTiles で表示するビューワー。

## デモ

ベースマップに国土地理院淡色地図を使用し、道路分類（N13_003）ごとに色分けして表示します。

## 機能

- **ズームレベル 2〜12**: 国道・高速自動車国道等のみ表示
- **ズームレベル 13〜20**: 全道路表示
- 道路クリックでプロパティポップアップ表示

## 道路分類（N13_003）の色分け

| コード | 内容 | 色 |
|---|---|---|
| 4 | 高速自動車国道等 | 紺（#003087） |
| 1 | 国道 | 赤（#e60026） |
| 2 | 都道府県道 | 青（#1a73e8） |
| 3 | 市区町村道等 | 緑（#28a745） |
| 5 | その他 | グレー |
| 6 | 不明 | 薄グレー |

## データソース

- **道路中心線 PMTiles**: `https://pmtiles-data.s3.ap-northeast-1.amazonaws.com/mlit/RoadCenterLine.pmtiles`
  - 国土数値情報 道路中心線（N13）2024年版
  - 約2,405万フィーチャ
  - ズームレベル 2〜14
- **ベースマップ**: 国土地理院ベクトルタイル（淡色地図）

## 技術スタック

- [MapLibre GL JS](https://maplibre.org/)
- [PMTiles](https://github.com/protomaps/PMTiles)
- [Vite](https://vitejs.dev/) + TypeScript

## 開発環境

```bash
npm install
npm run dev
```

http://localhost:5173 で起動します。

## ビルド

```bash
npm run build
```

## データ作成

PMTiles は [Tippecanoe](https://github.com/felt/tippecanoe) で生成しました。

```bash
tippecanoe \
  -Z 2 -z 14 \
  -l RoadCenterLine \
  -r1 \
  --no-feature-limit \
  --no-tile-size-limit \
  --force \
  -P \
  -o RoadCenterLine.pmtiles \
  geojson/*/N13-24_*.geojson
```

## ライセンス

地図データは[国土数値情報](https://nlftp.mlit.go.jp/ksj/)（国土交通省）を使用しています。
