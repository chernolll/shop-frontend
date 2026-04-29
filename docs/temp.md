# BD任务界面 — 前端实现计划

## 原始需求

1. BD用户查看被分配到的任务（task_bd_relation表），显示内容需关联task_main表 (`src/views/bd/my-tasks`路由界面)；
   - 每条任务row需要有一个提交"达人筹备表"的按钮（可多次提交新的达人），点击跳转到一个不在菜单栏显示的路由页面(/bd/my-task/:task_id)：
     - 可提供下载excel模板填写达人信息的按钮 (放在前端静态资源里)；
     - 上传excel文件的功能；
     - 解析excel文件、并且预览的功能：
       - 需要拿到数据（kol_id），发给后端，然后会返回该达人的状态（已被其他达人筹备 || 该达人已有所属BD || 该达人在这条任务中重复），只需发送kol_id给后端即可，不需要发送excel文件
       - BD可删除某条达人数据（比如被标记为重复或已有所属BD）；
       - 前端需检测提交的达人数据里，状态是否都是 normal ，否则需阻拦提交；
   - 需要有一个界面（看看需要跟上传筹备表界面一样是隐藏路由吗），让BD查看自己的达人筹备提交信息（里面有每条达人信息的提交记录和状态）；
2. BD提交后，admin会审核每条任务的达人筹备信息，审核通过后，后端会往task_sop创建一条记录，BD用户可在`src/views/bd/sop`查看（这里不做实现，知道有这个东西就好）

---

## 页面内容

### BD-我的任务 `/bd/my-task`

1. “我的任务”表格内容：
   - 商品链接 (product_listing.product_url)
   - 产品pdf链接 (product_listing.brief_url)
   - 佣金 (task_main.commission)
   - 视频数 (task_bd_relation.video_quantity)：已完成 / 总数
   - 是否有预算 (task_main.budget)
   - 截止日期 (task_main.deadline) 前端接收时间戳，格式化为字符串
   - 操作：上传达人筹备表
2. 上传筹备表界面：
   - 下载模板按钮；
   - 上传excel功能；
   - 有地方显示该界面要上传的达人是属于哪条任务的，可以暂时显示任务id；筹备表格内容：

- 所属任务ID（task_main.id, 只读）；
- 达人ID（kol_id,只读）；
- 录入时间（只读，默认上传时间，如果是解析后新增，就插入时间）；
- 状态（`playground/src/consts/bd-sop.ts`里的`KoaPrepareKolStatus`）

3. 筹备表提交记录界面，展示提交过的达人筹备信息：

- 跟上面的筹备表内容一致，多了2列（审核状态 (`playground/src/consts/bd-sop.ts`里的`KoaPrepareAuditStatus`)、remark）；

要求，不要做api接口实现，只需要完成UI和逻辑交互；然后组件内部请求数据的函数里，返回几条假数据，然后打上`// TODO:xxx`后续我自己完成
