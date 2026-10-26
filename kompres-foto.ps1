# =========================================================
# Alat bantu kompres foto untuk website RusianArt
# Cara pakai: di folder ini, jalankan lewat PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\kompres-foto.ps1
#
# Yang dilakukan:
#   - Foto di folder images/ yang berukuran besar (>300 KB)
#     dipangkatkan jadi maksimal 1200px, kualitas JPEG 80
#   - Foto asli dipindah aman ke images/asli/
#   - Orientasi foto potret dari HP ikut diperbaiki
# =========================================================

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$folderGambar = Join-Path $PSScriptRoot "images"
$folderAsli   = Join-Path $folderGambar "asli"

if (-not (Test-Path $folderGambar)) {
    Write-Host "Folder 'images' tidak ditemukan. Buat dulu dan taruh fotonya di situ." -ForegroundColor Yellow
    exit
}
if (-not (Test-Path $folderAsli)) {
    New-Item -ItemType Directory -Path $folderAsli | Out-Null
}

# koreksi orientasi EXIF foto HP (2=flip, 3=180, 4=flipV, 5=flip+270, 6=90, 7=flip+90, 8=270)
function Reset-Orientasi($img, $orientasi) {
    switch ($orientasi) {
        2 { $img.RotateFlip([System.Drawing.RotateFlipType]::FlipX) }
        3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        4 { $img.RotateFlip([System.Drawing.RotateFlipType]::FlipXY) }
        5 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipY) }
        6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        7 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipXY) }
        8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
    }
}

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }
$parameter = New-Object System.Drawing.Imaging.EncoderParameters(1)
$parameter.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]80)

$jumlah = 0
Get-ChildItem $folderGambar -File -Include *.jpg, *.jpeg, *.JPG, *.JPEG -Recurse:$false | ForEach-Object {
    $file = $_
    $ukuranAwal = $file.Length
    if ($ukuranAwal -le 300KB) {
        Write-Host ("DILEWATI (sudah kecil)  {0}" -f $file.Name) -ForegroundColor DarkGray
        return
    }

    $img = [System.Drawing.Image]::FromFile($file.FullName)
    try {
        # baca orientasi EXIF lalu rapikan
        $orientasi = 1
        foreach ($prop in $img.PropertyItems) {
            if ($prop.Id -eq 274) { $orientasi = $prop.Value[0] }
        }
        Reset-Orientasi $img $orientasi

        # hitung skala, maksimal sisi 1200px
        $sisiMaks = [Math]::Max($img.Width, $img.Height)
        $skala = [Math]::Min(1.0, 1200.0 / $sisiMaks)
        $lebar  = [int]($img.Width * $skala)
        $tinggi = [int]($img.Height * $skala)

        $hasil = New-Object System.Drawing.Bitmap($lebar, $tinggi)
        try {
            $g = [System.Drawing.Graphics]::FromImage($hasil)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.DrawImage($img, 0, 0, $lebar, $tinggi)
            $g.Dispose()

            # foto asli diamankan dulu, baru timpa dengan versi ringan
            Copy-Item $file.FullName -Destination (Join-Path $folderAsli $file.Name) -Force
            $hasil.Save($file.FullName, $encoder, $parameter)
        } finally { $hasil.Dispose() }
    } finally { $img.Dispose() }

    $ukuranAkhir = (Get-Item $file.FullName).Length
    Write-Host ("OK  {0}  {1} KB -> {2} KB" -f $file.Name, [int]($ukuranAwal/1KB), [int]($ukuranAkhir/1KB)) -ForegroundColor Green
    $jumlah++
}

Write-Host ""
if ($jumlah -eq 0) {
    Write-Host "Tidak ada foto yang perlu dikompres." -ForegroundColor Cyan
} else {
    Write-Host ("Selesai! {0} foto dikompres. Foto asli disimpan di images\asli\ (tidak ikut di-upload)." -f $jumlah) -ForegroundColor Cyan
}
