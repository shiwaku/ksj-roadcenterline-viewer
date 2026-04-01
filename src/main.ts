import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";

const BASE = import.meta.env.BASE_URL;
const GSI_PALE_STYLE = `${BASE}pale.json`;
const PMTILES_URL = "https://pmtiles-data.s3.ap-northeast-1.amazonaws.com/mlit/RoadCenterLine.pmtiles";

const ROAD_TYPE: Record<string, string> = {
  "1": "国道",
  "2": "都道府県道",
  "3": "市区町村道等",
  "4": "高速自動車国道等",
  "5": "その他",
  "6": "不明",
};

// N13_002: 種別（道路中心線種別コード）
const ROAD_KIND: Record<string, string> = {
  "1": "通常部",
  "2": "庭園路",
  "3": "徒歩道",
  "4": "石段",
  "5": "不明",
};

// N13_004: 道路状態（道路状態種別コード）
const ROAD_STATE: Record<string, string> = {
  "1": "通常部",
  "2": "橋・高架",
  "3": "トンネル",
  "4": "雪覆い",
  "5": "建設中",
  "6": "その他",
  "7": "不明",
};

// N13_006: 幅員区分（幅員区分コード）
const WIDTH_CLASS: Record<string, string> = {
  "1": "3m未満",
  "2": "3m-5.5m未満",
  "3": "5.5m-13m未満",
  "4": "13m-19.5m未満",
  "5": "19.5m以上",
  "6": "不明",
};

// N13_007: 有料区分（有料区分コード）
const TOLL: Record<string, string> = {
  "1": "無料",
  "2": "有料",
};


const ROAD_COLOR: Record<string, string> = {
  "1": "#e60026",  // 国道
  "2": "#1a73e8",  // 都道府県道
  "3": "#28a745",  // 市区町村道等
  "4": "#003087",  // 高速自動車国道等
  "5": "#888888",  // その他
  "6": "#cccccc",  // 不明
};

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const map = new maplibregl.Map({
  container: "map",
  style: GSI_PALE_STYLE,
  center: [136.5, 36.5],
  zoom: 5,
  hash: true,
  attributionControl: {
    customAttribution: '出典：<a href="https://nlftp.mlit.go.jp/ksj/" target="_blank">国土数値情報（国土交通省）</a>',
  },
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

map.on("load", () => {
  map.addSource("road", {
    type: "vector",
    url: `pmtiles://${PMTILES_URL}`,
  });

  const lineLayout: maplibregl.LineLayerSpecification["layout"] = {
    "line-join": "round",
    "line-cap": "round",
  };

  // Z2-12: 国道・高速のみ（国道→高速の順で上書き描画）
  map.addLayer({
    id: "road-line-major-kokudo",
    type: "line",
    source: "road",
    "source-layer": "RoadCenterLine",
    minzoom: 2,
    maxzoom: 12,
    filter: ["==", ["to-number", ["get", "N13_003"]], 1],
    layout: lineLayout,
    paint: {
      "line-color": ROAD_COLOR["1"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.5, 8, 1.5, 12, 3.0],
      "line-opacity": 0.8,
    },
  });

  map.addLayer({
    id: "road-line-major-highway",
    type: "line",
    source: "road",
    "source-layer": "RoadCenterLine",
    minzoom: 2,
    maxzoom: 12,
    filter: ["==", ["to-number", ["get", "N13_003"]], 4],
    layout: lineLayout,
    paint: {
      "line-color": ROAD_COLOR["4"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 2, 1.0, 8, 2.5, 12, 5.0],
      "line-opacity": 0.8,
    },
  });

  // Z12-20: 全道路（市区町村道等→都道府県道→国道→高速の順で上書き描画）
  map.addLayer({
    id: "road-line-all-minor",
    type: "line",
    source: "road",
    "source-layer": "RoadCenterLine",
    minzoom: 12,
    filter: ["match", ["to-number", ["get", "N13_003"]], [3, 5, 6], true, false],
    layout: lineLayout,
    paint: {
      "line-color": ["match", ["to-number", ["get", "N13_003"]], 3, ROAD_COLOR["3"], 5, ROAD_COLOR["5"], ROAD_COLOR["6"]],
      "line-width": ["interpolate", ["linear"], ["zoom"], 13, 1.0, 16, 2.0, 20, 4.0],
      "line-opacity": 0.8,
    },
  });

  map.addLayer({
    id: "road-line-all-pref",
    type: "line",
    source: "road",
    "source-layer": "RoadCenterLine",
    minzoom: 12,
    filter: ["==", ["to-number", ["get", "N13_003"]], 2],
    layout: lineLayout,
    paint: {
      "line-color": ROAD_COLOR["2"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 13, 1.0, 16, 2.0, 20, 4.0],
      "line-opacity": 0.8,
    },
  });

  map.addLayer({
    id: "road-line-all-kokudo",
    type: "line",
    source: "road",
    "source-layer": "RoadCenterLine",
    minzoom: 12,
    filter: ["==", ["to-number", ["get", "N13_003"]], 1],
    layout: lineLayout,
    paint: {
      "line-color": ROAD_COLOR["1"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 13, 2.5, 16, 5.0, 20, 9.0],
      "line-opacity": 0.8,
    },
  });

  map.addLayer({
    id: "road-line-all-highway",
    type: "line",
    source: "road",
    "source-layer": "RoadCenterLine",
    minzoom: 12,
    filter: ["==", ["to-number", ["get", "N13_003"]], 4],
    layout: lineLayout,
    paint: {
      "line-color": ROAD_COLOR["4"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 13, 4.0, 16, 8.0, 20, 14.0],
      "line-opacity": 0.8,
    },
  });

  // クリックでポップアップ
  const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
    if (!e.features?.length) return;
    const props = e.features[0].properties;
    const typeCode = String(props["N13_003"] ?? "");
    const typeName = ROAD_TYPE[typeCode] ?? typeCode;

    const kindCode  = String(props["N13_002"] ?? "");
    const stateCode = String(props["N13_004"] ?? "");
    const widthCode = String(props["N13_006"] ?? "");
    const tollCode  = String(props["N13_007"] ?? "");

    const rows = [
      ["データ登録日",     props["N13_001"] ?? "—"],
      ["種別",             ROAD_KIND[kindCode]   ?? kindCode],
      ["道路分類",         typeName],
      ["道路状態",         ROAD_STATE[stateCode] ?? stateCode],
      ["階層順",           props["N13_005"] ?? "—"],
      ["幅員区分",         WIDTH_CLASS[widthCode] ?? widthCode],
      ["有料区分",         TOLL[tollCode]         ?? tollCode],
      ["二次メッシュ番号", props["N13_008"] ?? "—"],
    ]
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join("");

    new maplibregl.Popup({ maxWidth: "280px" })
      .setLngLat(e.lngLat)
      .setHTML(`<div class="popup-content"><table>${rows}</table></div>`)
      .addTo(map);
  };

  const allLayerIds = [
    "road-line-major-kokudo", "road-line-major-highway",
    "road-line-all-minor", "road-line-all-pref", "road-line-all-kokudo", "road-line-all-highway",
  ];
  for (const id of allLayerIds) {
    map.on("click", id, clickHandler);
    map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
  }
});
