完成`'/bd/sop/list'`路由对应的组件功能，也是表格，具备筛选查询逻辑；下面是后端接口的请求参数和响应内容；`BDSOPItem.Status`是SOP处于哪个阶段，这一列可点击，然后跳转到一个跟`/bd/sop/:sop_id`隐藏路由里，查看一整个流程的不同信息（详情页具体功能暂不实现，只需建好路由和访问组件即可）

# 注意

后面实现的内容，都需要注意国际化，即在前端展示的内容，都需要注意是否需要翻译，不能直接使用中文，否则会导致用户无法理解。

```go
// 接口信息
type bdSOPListRequest struct { // 接口传参
	StartDate *int64 `form:"start_date"` // 任务创建时间
	EndDate   *int64 `form:"end_date"` // 任务截止日期
	SOPStatus *int   `form:"sop_status" binding:"omitempty,min=0,max=3"`
	Page      int    `form:"page" binding:"required,min=1"`
	PageSize  int    `form:"page_size" binding:"required,min=1,max=200"`
}

type BDSOPItem struct {
	ID             int64   `json:"id"`
	TaskBDID       int64   `json:"task_bd_id"`
	TaskID         int64   `json:"task_id"`
	BDCode         string  `json:"bd_code"`
	KolID          string  `json:"kol_id"`
	ProductID      int64   `json:"product_id"`
	ProductURL     *string `json:"product_url"`
	BriefURL       *string `json:"brief_url"`
	Status         int     `json:"status"`
	TaskCommission float64 `json:"task_commission"`
	TaskDeadline   *int64  `json:"task_deadline"`
	TaskBudget     int     `json:"task_budget"`
	TaskType       int     `json:"task_type"`
	TaskCreatedAt  int64   `json:"task_created_at"`
}

type BDSOPListResult struct { // 响应内容
	Total    int         `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
	List     []BDSOPItem `json:"list"`
}
```

```go
// SOP状态
// SOP 状态常量
const (
	SOPStatusContact   = 0 // 建联
	SOPStatusSample    = 1 // 送样
	SOPStatusRecover   = 2 // 回收视频
	SOPStatusCompleted = 3 // 结束
)
```
