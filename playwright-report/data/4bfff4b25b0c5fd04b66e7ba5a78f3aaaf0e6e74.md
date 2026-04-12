# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin/bookings.spec.ts >> Admin Bookings Management >> должна позволять отменить бронирование как админ
- Location: e2e/admin/bookings.spec.ts:170:7

# Error details

```
Error: apiRequestContext.put: connect ECONNREFUSED ::1:3000
Call log:
  - → PUT http://localhost:3000/api/v1/schedule
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json
    - Authorization: Basic YWRtaW46YWRtaW4xMjM=
    - content-length: 445

```