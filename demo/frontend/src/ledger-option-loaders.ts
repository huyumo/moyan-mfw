/**
 * @fileoverview 借贷记账扩展筛选动态选项加载器（业务层前端注册）
 * @description 元数据 search[].optionsSource 声明的动态选项来源在此注册加载器：
 *   - campaigns：推广活动列表（对应 promo_reward.campaignId 扩展筛选，下拉）
 *   - regions：省市区级联树（对应 promo_reward.region 扩展筛选，cascader）
 * 选项加载器是业务数据获取代码（调业务 API），天然属于前端业务层
 */

import { registerSearchOptionLoader } from "moyan-mfw-extension-ledger/frontend";
import { useAuthStore } from "moyan-mfw-base/frontend";

/** 带 token 拉取 demo 接口（扩展筛选动态选项数据源） */
async function fetchDemo(path: string): Promise<any> {
  const auth = useAuthStore();
  const res: any = await fetch(`/api/demo/ledger-spi/${path}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  }).then((r) => r.json());
  return res?.data;
}

registerSearchOptionLoader("campaigns", async () => {
  const data = await fetchDemo("campaigns");
  const items = data?.items ?? [];
  return items.map((c: any) => ({ value: c.id, label: `${c.name}（${c.id}）` }));
});

registerSearchOptionLoader("regions", async () => {
  const data = await fetchDemo("regions");
  return data?.items ?? []; // 树形：{ value, label, children? }
});
