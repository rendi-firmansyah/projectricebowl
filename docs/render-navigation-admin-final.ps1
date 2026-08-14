Add-Type -AssemblyName System.Drawing

$width = 2400
$height = 1250
$outPath = Join-Path $PSScriptRoot 'navigation-admin-final.png'

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::White)

$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2)
$brush = [System.Drawing.Brushes]::Black
$fontTitle = New-Object System.Drawing.Font('Arial', 16, [System.Drawing.FontStyle]::Bold)
$font = New-Object System.Drawing.Font('Arial', 12, [System.Drawing.FontStyle]::Regular)
$fontSmall = New-Object System.Drawing.Font('Arial', 10, [System.Drawing.FontStyle]::Regular)

function Draw-CenteredText($text, $x, $y, $w, $h, $fontToUse) {
    $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $sf.Trimming = [System.Drawing.StringTrimming]::Word
    $g.DrawString($text, $fontToUse, $brush, $rect, $sf)
    $sf.Dispose()
}

function Draw-Box($text, $cx, $cy, $w = 170, $h = 46, $fontToUse = $font) {
    $x = $cx - ($w / 2)
    $y = $cy - ($h / 2)
    $g.FillRectangle([System.Drawing.Brushes]::White, $x, $y, $w, $h)
    $g.DrawRectangle($pen, $x, $y, $w, $h)
    Draw-CenteredText $text $x $y $w $h $fontToUse
}

function Draw-Line($x1, $y1, $x2, $y2) {
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
}

function Draw-Arrow($x1, $y1, $x2, $y2) {
    Draw-Line $x1 $y1 $x2 $y2
    $angle = [Math]::Atan2($y2 - $y1, $x2 - $x1)
    $size = 11
    [System.Drawing.PointF[]]$head = @(
        [System.Drawing.PointF]::new([single]$x2, [single]$y2),
        [System.Drawing.PointF]::new(
            [single]($x2 - $size * [Math]::Cos($angle - [Math]::PI / 6)),
            [single]($y2 - $size * [Math]::Sin($angle - [Math]::PI / 6))
        ),
        [System.Drawing.PointF]::new(
            [single]($x2 - $size * [Math]::Cos($angle + [Math]::PI / 6)),
            [single]($y2 - $size * [Math]::Sin($angle + [Math]::PI / 6))
        )
    )
    $g.FillPolygon($brush, $head)
}

function Draw-VerticalChain($items, $cx, $startY, $gap = 70, $w = 180, $fontToUse = $font) {
    for ($i = 0; $i -lt $items.Count; $i++) {
        $y = $startY + ($i * $gap)
        Draw-Box $items[$i] $cx $y $w 46 $fontToUse
        if ($i -lt $items.Count - 1) {
            Draw-Arrow $cx ($y + 23) $cx ($y + $gap - 23)
        }
    }
}

# Root and login flow
Draw-Box 'ADMIN' 1200 55 260 52 $fontTitle
Draw-Arrow 1200 81 1200 122
Draw-Box 'Login Admin' 1200 150 220 46 $font
Draw-Arrow 1200 173 1200 222
Draw-Box 'Dashboard Admin' 1200 250 240 46 $font
Draw-Arrow 1200 273 1200 330

# Main admin navigation level
$mainY = 380
$main = @(
    @{Label='Dashboard'; X=130; W=165},
    @{Label='Menu'; X=360; W=165},
    @{Label='Pesanan'; X=590; W=165},
    @{Label='Pelanggan'; X=820; W=165},
    @{Label='Promo'; X=1050; W=165},
    @{Label='Pembayaran'; X=1280; W=180},
    @{Label='Galeri'; X=1520; W=165},
    @{Label='Testimoni'; X=1750; W=165},
    @{Label='Laporan'; X=1980; W=165},
    @{Label='Logout Account'; X=2210; W=190}
)

Draw-Line 130 330 2210 330
foreach ($item in $main) {
    Draw-Arrow $item.X 330 $item.X ($mainY - 23)
    Draw-Box $item.Label $item.X $mainY $item.W 46 $font
}

# Sub menu: Menu
Draw-Line 355 ($mainY + 23) 355 470
Draw-Arrow 355 470 355 512
Draw-VerticalChain @('Daftar Menu', 'Tambah Menu', 'Kategori Menu') 355 535 70 190 $font

# Sub menu: Pesanan
Draw-Line 580 ($mainY + 23) 580 470
Draw-Arrow 580 470 580 512
Draw-VerticalChain @('Semua Pesanan', 'Pesanan Baru', 'Sedang Dimasak', 'Siap Diambil', 'Selesai', 'Dibatalkan') 580 535 70 205 $fontSmall

# Sub menu: Laporan
Draw-Line 1980 ($mainY + 23) 1980 470
Draw-Arrow 1980 470 1980 512
Draw-VerticalChain @('Laporan Penjualan', 'Laporan Pendapatan', 'Menu Terlaris') 1980 535 70 210 $fontSmall

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "Created $outPath"
