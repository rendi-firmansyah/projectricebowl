Add-Type -AssemblyName System.Drawing

$width = 1800
$height = 1180
$outPath = Join-Path $PSScriptRoot 'navigation-user-final.png'

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.Color]::White)

$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2)
$brush = [System.Drawing.Brushes]::Black
$fontTitle = New-Object System.Drawing.Font('Arial', 16, [System.Drawing.FontStyle]::Bold)
$font = New-Object System.Drawing.Font('Arial', 12, [System.Drawing.FontStyle]::Regular)

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

function Draw-VerticalChain($items, $cx, $startY, $gap = 72, $w = 180) {
    for ($i = 0; $i -lt $items.Count; $i++) {
        $y = $startY + ($i * $gap)
        Draw-Box $items[$i] $cx $y $w 46 $font
        if ($i -lt $items.Count - 1) {
            Draw-Arrow $cx ($y + 23) $cx ($y + $gap - 23)
        }
    }
}

# Root
Draw-Box 'USER / KLIEN' 900 55 300 52 $fontTitle
Draw-Line 900 81 900 125

# Main navigation level
$mainY = 175
$main = @(
    @{Label='Beranda'; X=165},
    @{Label='Menu'; X=405},
    @{Label='Smart Order'; X=645},
    @{Label='Keranjang'; X=900},
    @{Label='Profil'; X=1155},
    @{Label='Login'; X=1410}
)
Draw-Line 165 125 1410 125
foreach ($item in $main) {
    Draw-Arrow $item.X 125 $item.X ($mainY - 23)
    Draw-Box $item.Label $item.X $mainY 170 46 $font
}

# Sub navigation/proses sesuai halaman induk
$subTop = 315

# Menu branch
Draw-Line 405 ($mainY + 23) 405 265
Draw-Line 405 265 290 265
Draw-Arrow 290 265 290 ($subTop - 23)
Draw-VerticalChain @('Pilih Menu', 'Pilih Add-ons') 290 $subTop 72 190

# Smart Order branch
Draw-Line 645 ($mainY + 23) 645 265
Draw-Line 645 265 595 265
Draw-Arrow 595 265 595 ($subTop - 23)
Draw-VerticalChain @('Ketik Pesanan', 'Draft Order', 'Tambah ke Keranjang') 595 $subTop 72 220

# Keranjang branch
Draw-Line 900 ($mainY + 23) 900 265
Draw-Line 900 265 890 265
Draw-Arrow 890 265 890 ($subTop - 23)
Draw-VerticalChain @('Checkout', 'Pembayaran', 'Upload Bukti', 'Status Pesanan', 'Invoice / Struk') 890 $subTop 72 205

# Profil branch
Draw-Line 1155 ($mainY + 23) 1155 265
Draw-Line 1155 265 1195 265
Draw-Arrow 1195 265 1195 ($subTop - 23)
Draw-VerticalChain @('My Orders', 'Favorites', 'Addresses', 'Payment', 'Logout') 1195 $subTop 72 190

# Login branch
Draw-Line 1410 ($mainY + 23) 1410 265
Draw-Line 1410 265 1485 265
Draw-Arrow 1485 265 1485 ($subTop - 23)
Draw-VerticalChain @('Register', 'Verifikasi Email', 'Dashboard User') 1485 $subTop 72 210

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "Created $outPath"
