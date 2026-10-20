$ErrorActionPreference = "Stop"
$base = "http://localhost:3000"
$cookies = "$env:TEMP\seokub-cookies6.txt"
Remove-Item $cookies -ErrorAction SilentlyContinue

$csrfJson = curl.exe -s -c $cookies "$base/api/auth/csrf"
$csrf = ($csrfJson | ConvertFrom-Json).csrfToken
curl.exe -s -c $cookies -b $cookies -o NUL -X POST "$base/api/auth/callback/dev" -H "Content-Type: application/x-www-form-urlencoded" -d "email=test@example.com&csrfToken=$csrf"

Write-Host "=== GSC endpoint (dev user, no Google) ==="
$gsc = curl.exe -s -c $cookies -b $cookies -w "`nHTTP %{http_code}" "$base/api/search-console?url=https://example.com"
Write-Host $gsc

Write-Host "=== GSC unauth ==="
$gsc2 = curl.exe -s -w "`nHTTP %{http_code}" "$base/api/search-console?url=https://example.com"
Write-Host $gsc2

Write-Host "=== report page has Search Console tab ==="
$audit = curl.exe -s -c $cookies -b $cookies -X POST "$base/api/audits" -H "Content-Type: application/json" -d '{\"url\":\"https://example.com\"}'
$auditId = ($audit | ConvertFrom-Json).id
$reportPage = curl.exe -s -c $cookies -b $cookies "$base/audit/$auditId"
Write-Host "has Search Console tab: $($reportPage -match 'Search Console')"

Write-Host "=== GSC rate limit (31 requests) ==="
for ($i=1; $i -le 31; $i++) { curl.exe -s -c $cookies -b $cookies -o NUL -X GET "$base/api/search-console?url=https://example.com" }
$rl = curl.exe -s -w " HTTP %{http_code}" "$base/api/search-console?url=https://example.com"
Write-Host $rl
