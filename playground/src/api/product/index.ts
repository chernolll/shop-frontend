import { requestClient } from '../request';

export namespace AdminProductApi {
  export enum Status {
    OFF_SHELF = 0,
    ON_SALE = 1,
  }

  export enum SkuType {
    SINGLE = 0,
    BUNDLE = 1,
  }

  export interface SkuListParams {
    brand?: string;
    id?: number;
    page: number;
    page_size: number;
    sku_code?: string;
    sku_name?: string;
    sku_type?: SkuType;
    status?: Status;
  }

  export interface SkuItem {
    active_sop_count: number;
    brand: string;
    cost_price: number;
    created_at: number;
    currency: string;
    id: number;
    offline_margin: null | number;
    online_margin: null | number;
    retail_price: number;
    sku_code: string;
    sku_name: string;
    sku_type: SkuType;
    status: Status;
    updated_at: number;
  }

  export interface SkuListResult {
    list: SkuItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface SkuDetailParams {
    id: number | string;
  }

  export interface SkuCreateParams {
    brand: string;
    cost_price?: number;
    currency?: string;
    offline_margin?: null | number;
    online_margin?: null | number;
    retail_price?: number;
    sku_code: string;
    sku_name: string;
    sku_type: SkuType;
    status: Status;
  }

  export interface SkuUpdateParams extends SkuCreateParams {
    id: number | string;
  }

  export interface DeleteParams {
    id: number | string;
  }

  export interface DeleteResult {
    id: number;
  }

  export interface ProductListingListParams {
    page: number;
    page_size: number;
    product_listing_id?: number;
    product_url?: string;
    shop_id?: number;
    shop_name?: string;
    status?: Status;
  }

  export interface ProductListingItem {
    active_sop_count: number;
    commission_private: number;
    commission_public: number;
    country: string;
    created_at: number;
    id: number;
    main_sku_brand: null | string;
    main_sku_code: null | string;
    main_sku_id: null | number;
    main_sku_name: null | string;
    main_sku_status: null | Status;
    product_url: string;
    shop_id: number;
    shop_name: string;
    status: Status;
    updated_at: number;
  }

  export interface ProductListingListResult {
    list: ProductListingItem[];
    page: number;
    page_size: number;
    total: number;
  }

  export interface ProductListingDetailParams {
    id: number | string;
  }

  export interface ProductListingCreateParams {
    commission_private?: number;
    commission_public?: number;
    file_key?: string;
    main_sku_id: number;
    product_url: string;
    shop_id: number;
    status: Status;
  }

  export interface ProductListingUpdateParams extends ProductListingCreateParams {
    id: number | string;
  }
}

export async function getAdminSkuList(params: AdminProductApi.SkuListParams) {
  return requestClient.get<AdminProductApi.SkuListResult>('/admin/skus', {
    params,
  });
}

export async function getAdminSkuDetail(
  params: AdminProductApi.SkuDetailParams,
) {
  return requestClient.get<AdminProductApi.SkuItem>('/admin/skus/detail', {
    params,
  });
}

export async function createAdminSku(data: AdminProductApi.SkuCreateParams) {
  return requestClient.post<AdminProductApi.SkuItem>('/admin/skus', data);
}

export async function updateAdminSku(data: AdminProductApi.SkuUpdateParams) {
  return requestClient.put<AdminProductApi.SkuItem>('/admin/skus', data);
}

export async function deleteAdminSku(data: AdminProductApi.DeleteParams) {
  return requestClient.delete<AdminProductApi.DeleteResult>('/admin/skus', {
    data,
  });
}

export async function getAdminProductListingList(
  params: AdminProductApi.ProductListingListParams,
) {
  return requestClient.get<AdminProductApi.ProductListingListResult>(
    '/admin/product-listings',
    {
      params,
    },
  );
}

export async function getAdminProductListingDetail(
  params: AdminProductApi.ProductListingDetailParams,
) {
  return requestClient.get<AdminProductApi.ProductListingItem>(
    '/admin/product-listings/detail',
    {
      params,
    },
  );
}

export async function createAdminProductListing(
  data: AdminProductApi.ProductListingCreateParams,
) {
  return requestClient.post<AdminProductApi.ProductListingItem>(
    '/admin/product-listings',
    data,
  );
}

export async function updateAdminProductListing(
  data: AdminProductApi.ProductListingUpdateParams,
) {
  return requestClient.put<AdminProductApi.ProductListingItem>(
    '/admin/product-listings',
    data,
  );
}

export async function deleteAdminProductListing(
  data: AdminProductApi.DeleteParams,
) {
  return requestClient.delete<AdminProductApi.DeleteResult>(
    '/admin/product-listings',
    {
      data,
    },
  );
}
