import { requestClient } from '../request';

export namespace ThailandApi {
  export interface DistrictInfo {
    city: string;
    name: string;
    province: string;
  }

  export interface PostcodeListResult {
    postcodes: string[];
  }

  export interface DistrictListResult {
    districts: DistrictInfo[];
    postcode: string;
  }
}

/** 获取所有泰国邮编列表 */
export async function getThailandPostcodes() {
  return requestClient.get<ThailandApi.PostcodeListResult>(
    '/thailand/postcodes',
  );
}

/** 根据邮编获取区信息 */
export async function getThailandDistricts(postcode: string) {
  return requestClient.get<ThailandApi.DistrictListResult>(
    '/thailand/districts',
    { params: { postcode } },
  );
}
