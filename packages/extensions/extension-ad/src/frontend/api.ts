/**
 * @fileoverview 广告扩展包前端 API 层
 * @description 封装与后端控制器的 HTTP 通信。需运行 pnpm api:build 后更新为 moyan-api 自动生成的代码
 */

import axios from 'axios'

const http = axios.create({ baseURL: '/api/ext' })

export const AdApi = {
  // ======== 广告位类型配置 ========
  createType(body: any) {
    return http.post('/ad-placement-types', body)
  },
  updateType(id: string, body: any) {
    return http.put(`/ad-placement-types/${id}`, body)
  },
  deleteType(id: string) {
    return http.delete(`/ad-placement-types/${id}`)
  },
  getTypes(params: any) {
    return http.get('/ad-placement-types', { params })
  },
  getType(id: string) {
    return http.get(`/ad-placement-types/${id}`)
  },

  // ======== 广告位 ========
  createPlacement(body: any) {
    return http.post('/ad-placements', body)
  },
  updatePlacement(id: string, body: any) {
    return http.put(`/ad-placements/${id}`, body)
  },
  deletePlacement(id: string) {
    return http.delete(`/ad-placements/${id}`)
  },
  getPlacements(params: any) {
    return http.get('/ad-placements', { params })
  },
  getPlacement(id: string) {
    return http.get(`/ad-placements/${id}`)
  },

  // ======== 广告内容 ========
  createAd(body: any) {
    return http.post('/ad-contents', body)
  },
  updateAd(id: string, body: any) {
    return http.put(`/ad-contents/${id}`, body)
  },
  deleteAd(id: string) {
    return http.delete(`/ad-contents/${id}`)
  },
  getAds(params: any) {
    return http.get('/ad-contents', { params })
  },
  getAd(id: string) {
    return http.get(`/ad-contents/${id}`)
  },
}
