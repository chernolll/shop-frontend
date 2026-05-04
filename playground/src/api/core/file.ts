import { requestClient } from '../request';

export namespace FileApi {
  export interface BriefAccessUrlParams {
    product_listing_id: number | string;
  }

  export interface BriefAccessUrlResult {
    access_url: string;
    expired_at: number;
    file_key: string;
    file_name: string;
    method: string;
    product_listing_id: number;
    r2_file_id: number;
  }

  export interface UploadUrlParams {
    biz_type: string;
    content_type: string;
    file_name: string;
  }

  export interface UploadUrlResult {
    expired_at: number;
    file_key: string;
    file_name: string;
    headers: Record<string, string>;
    method: string;
    upload_url: string;
  }

  export interface RegisterFileParams {
    file_key: string;
    file_name: string;
  }

  export interface RegisterFileResult {
    file_key: string;
    file_name: string;
    id: number;
  }
}

/** 获取文件预签名上传地址 */
export async function getFileUploadUrl(data: FileApi.UploadUrlParams) {
  return requestClient.post<FileApi.UploadUrlResult>('/file/upload-url', data);
}

/** 获取产品 Brief 访问链接 */
export async function getBriefAccessUrl(params: FileApi.BriefAccessUrlParams) {
  return requestClient.get<FileApi.BriefAccessUrlResult>(
    '/file/brief-access-url',
    {
      params,
    },
  );
}

/** 登记已上传文件 */
export async function registerUploadedFile(data: FileApi.RegisterFileParams) {
  return requestClient.post<FileApi.RegisterFileResult>('/file/register', data);
}
