# SOP-视频回收阶段

1. 获取SOP-视频阶段的信息：`GET /bd/sop/video`, 参数`task_sop_id`

```go
响应参数
type BDSOPVideoDetailResult struct {
	TaskSOPID       int64   `json:"task_sop_id"`
	SOPStatus       int     `json:"sop_status"`
	TerminateRemark *string `json:"terminate_remark,omitempty"`
	VideoURL        string  `json:"video_url"`
	UploadTime      *int64  `json:"upload_time"`
	AdsCode         *string `json:"ads_code"`
}
```

2. 提交视频信息： `PUT /bd/sop/video`

```go
// 请求信息
type updateSOPVideoRequest struct {
	TaskSOPID  int64   `json:"task_sop_id" binding:"required"`
	VideoURL   string  `json:"video_url" binding:"required"`
	UploadTime int64   `json:"upload_time" binding:"required,gt=0"`
	AdsCode    *string `json:"ads_code"`
}
// 响应信息
type UpdateSOPVideoResult struct {
	SOPStatus  int     `json:"sop_status"`
	VideoURL   string  `json:"video_url"`
	UploadTime int64   `json:"upload_time"`
	AdsCode    *string `json:"ads_code"`
}
```

前端的视频阶段UI，仅需展示：

- 视频链接
- ads_code，（无值就空着）；
- 上传时间
- 上传的时候，二次确认；上传成功后，BD这里只能只读了，不能继续提交
- 提交成功后，如果返回的sop_status有进入下一阶段，前端也需要同步更新
