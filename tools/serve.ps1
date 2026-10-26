# Minimal static web server for the ATM11 guide (no Python needed). Used by start.bat.
param([string]$Root = (Join-Path $PSScriptRoot '..\docs'), [int]$Port = 8811)
$Root = (Resolve-Path $Root).Path.TrimEnd('\')
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.mjs'='text/javascript; charset=utf-8';
  '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png';
  '.jpg'='image/jpeg'; '.gif'='image/gif'; '.ico'='image/x-icon'; '.txt'='text/plain; charset=utf-8'; '.woff2'='font/woff2' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
try { $l.Start() } catch { Write-Host "Cannot start server on port $Port (already running in another window?): $($_.Exception.Message)"; exit 1 }
Write-Host "ATM11 guide: http://localhost:$Port/   (close this window to stop)"
Start-Process "http://localhost:$Port/"
while ($l.IsListening) {
  try { $ctx = $l.GetContext() } catch { break }
  $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq '') { $rel = 'index.html' }
    $path = [IO.Path]::GetFullPath((Join-Path $Root ($rel -replace '/', '\')))
    if ($path.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $path -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($path)
      $ext = [IO.Path]::GetExtension($path).ToLower()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-cache')
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $res.StatusCode = 404 }
  } catch { $res.StatusCode = 500 }
  finally { $res.Close() }
}
