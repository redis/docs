To get the cost report using the REST API:

1. Use [`POST /cost-report`]({{< relref "/operate/rc/api/api-reference#tag/Account/operation/createCostReport" >}}) to generate a cost report, with the request body containing the `startDate` and `endDate` for the report as well as any optional filters. The response includes a `taskId` that you can use to track the status of the report generation.
1. Use [`GET /tasks/{taskId}`]({{< relref "/operate/rc/api/api-reference#tag/Tasks/operation/getTaskById" >}}) to check report generation status. The report is ready when the `status` is `processing-completed` and the `response` field will contain a `costReportId`.
1. Use [`GET /cost-report/{costReportId}`]({{< relref "/operate/rc/api/api-reference#tag/Account/operation/getCostReport" >}}) to download the generated cost report.

The cost report returned from the Redis Cloud REST API contains all columns from the [FOCUS column library](https://focus.finops.org/focus-columns/).