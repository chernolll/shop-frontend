import { requestClient } from '#/api/request';

export namespace AdminShopApi {
  export interface ListParams {
    country?: string;
    id?: number;
    page: number;
    page_size: number;
    platform?: number;
    platform_shop_id?: string;
    shop_name?: string;
    shop_type?: number;
    status?: number;
  }

  export interface ShopItem {
    country: string;
    created_at: number;
    id: number;
    owner_user_id: null | number;
    platform: number;
    platform_shop_id: string;
    shop_name: string;
    shop_type: number;
    status: number;
    updated_at: number;
  }

  export interface ListResult {
    list: ShopItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface CreateParams {
    country: string;
    owner_user_id?: null | number;
    platform: number;
    platform_shop_id: string;
    shop_name: string;
    shop_type: number;
    status: number;
  }

  export interface UpdateParams extends CreateParams {
    id: number;
  }

  export interface DetailParams {
    id: number;
  }

  export interface DeleteParams {
    id: number;
  }
}

export async function getAdminShopList(params: AdminShopApi.ListParams) {
  return requestClient.get<AdminShopApi.ListResult>('/admin/shops', {
    params,
  });
}

export async function getAdminShopDetail(params: AdminShopApi.DetailParams) {
  return requestClient.get<AdminShopApi.ShopItem>('/admin/shops/detail', {
    params,
  });
}

export async function createAdminShop(data: AdminShopApi.CreateParams) {
  return requestClient.post<AdminShopApi.ShopItem>('/admin/shops', data);
}

export async function updateAdminShop(data: AdminShopApi.UpdateParams) {
  return requestClient.put<AdminShopApi.ShopItem>('/admin/shops', data);
}

export async function deleteAdminShop(params: AdminShopApi.DeleteParams) {
  return requestClient.delete<AdminShopApi.ShopItem>('/admin/shops', {
    params,
  });
}
