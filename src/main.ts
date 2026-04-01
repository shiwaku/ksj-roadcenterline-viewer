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

const DIRECTION: Record<string, string> = {
  "1": "上下線なし／不明",
  "2": "上り線",
  "3": "下り線",
};

const WIDTH_CLASS: Record<string, string> = {
  "0": "不明",
  "1": "13m以上",
  "2": "5.5m以上13m未満",
  "3": "3m以上5.5m未満",
  "4": "3m未満",
};

const SPECIFIC_ROAD: Record<string, string> = {
  "1": "該当しない",
  "2": "高速自動車国道",
  "3": "一般国道自動車専用道路",
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

  const colorExpr: maplibregl.ExpressionSpecification = [
    "match",
    ["to-number", ["get", "N13_003"]],
    1, ROAD_COLOR["1"],
    2, ROAD_COLOR["2"],
    3, ROAD_COLOR["3"],
    4, ROAD_COLOR["4"],
    5, ROAD_COLOR["5"],
    6, ROAD_COLOR["6"],
    "#cccccc",
  ];

  // Z2-12: 国道・高速のみ
  map.addLayer({
    id: "road-line-major",
    type: "line",
    source: "road",
    "source-layer": "RoadCenterLine",
    minzoom: 2,
    maxzoom: 12,
    filter: ["match", ["to-number", ["get", "N13_003"]], [1, 4], true, false],
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": colorExpr,
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        2,  ["match", ["to-number", ["get", "N13_003"]], 4, 1.0, 0.5],
        8,  ["match", ["to-number", ["get", "N13_003"]], 4, 2.5, 1.5],
        12, ["match", ["to-number", ["get", "N13_003"]], 4, 5.0, 3.0],
      ],
      "line-opacity": 0.8,
    },
  });

  // Z13-20: 全道路
  map.addLayer({
    id: "road-line-all",
    type: "line",
    source: "road",
    "source-layer": "RoadCenterLine",
    minzoom: 12,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": colorExpr,
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        13, ["match", ["to-number", ["get", "N13_003"]], 4, 4.0, 1, 2.5, 1.0],
        16, ["match", ["to-number", ["get", "N13_003"]], 4, 8.0, 1, 5.0, 2.0],
        20, ["match", ["to-number", ["get", "N13_003"]], 4, 14.0, 1, 9.0, 4.0],
      ],
      "line-opacity": 0.8,
    },
  });

  // クリックでポップアップ
  const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
    if (!e.features?.length) return;
    const props = e.features[0].properties;
    const typeCode = String(props["N13_003"] ?? "");
    const typeName = ROAD_TYPE[typeCode] ?? typeCode;

    const dirCode   = String(props["N13_002"] ?? "");
    const widthCode = String(props["N13_004"] ?? "");
    const width     = props["N13_005"];
    const lanes     = props["N13_006"];
    const specCode  = String(props["N13_007"] ?? "");

    const rows = [
      ["路線コード",   props["N13_008"] ?? "—"],
      ["更新日",       props["N13_001"] ?? "—"],
      ["道路分類",     `${typeName}`],
      ["上下線区分",   DIRECTION[dirCode]   ?? dirCode],
      ["幅員区分",     WIDTH_CLASS[widthCode] ?? widthCode],
      ["幅員",         width ? `${width} m` : "不明"],
      ["車線数",       lanes != null && lanes !== 0 ? `${lanes} 車線` : "不明"],
      ["特定道路",     SPECIFIC_ROAD[specCode] ?? specCode],
    ]
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join("");

    new maplibregl.Popup({ maxWidth: "280px" })
      .setLngLat(e.lngLat)
      .setHTML(`<div class="popup-content"><table>${rows}</table></div>`)
      .addTo(map);
  };

  for (const id of ["road-line-major", "road-line-all"]) {
    map.on("click", id, clickHandler);
    map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
  }
});
