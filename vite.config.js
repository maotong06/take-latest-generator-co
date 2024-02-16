/* eslint-disable no-undef */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import react from '@vitejs/plugin-react'
import mockData from "vite-plugin-mock-data";
import qs from "qs";
import path from 'path'

const isDevVue = process.argv.indexOf('--devVue') >= 0
const isDevReact = process.argv.indexOf('--devReact') >= 0
console.log('isDevVue', isDevVue, isDevReact)
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mockData({
      mockRoutes: {
        "/api/delayTime": async function (req, res) {
          res.statusCode = 200;
          const { time, data } = qs.parse(req._parsedUrl.query);
          res.setHeader("Content-Type", "application/json");
          await delayTime(time);
          res.end(JSON.stringify({ data: data }));
        },
        "/api/delayTime1": async function (req, res) {
          res.statusCode = 500;
          res.end();
        },
      },
    }),
    isDevVue && vue(),
    isDevReact && react(),
  ],
  build: {
    lib: {
      name: "takeLatestGeneratorCo",
      entry: [
        path.resolve(__dirname, "src/axiosWarp.ts"),
        path.resolve(__dirname, "src/core.ts"),
        path.resolve(__dirname, "src/fetchWithCancel.ts"),
        path.resolve(__dirname, "src/react.ts"),
        path.resolve(__dirname, "src/vue.ts")
      ],
      formats: ["es"],
    },
    minify: false,
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'react']
    },
  },
});

function delayTime(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, Number(time));
  });
}
