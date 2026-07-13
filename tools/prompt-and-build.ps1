param(
  [string]$Source = (Join-Path (Split-Path $PSScriptRoot -Parent) 'escala-nortada-2026-2028.html'),
  [string]$Output = (Join-Path (Split-Path $PSScriptRoot -Parent) 'docs\index.html'),
  [string]$Node = 'node'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Nortada · Palavra-passe'
$form.StartPosition = 'CenterScreen'
$form.ClientSize = New-Object System.Drawing.Size(440, 300)
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Proteger a Nortada'
$title.Font = New-Object System.Drawing.Font('Segoe UI Semibold', 18)
$title.Location = New-Object System.Drawing.Point(28, 22)
$title.AutoSize = $true
$form.Controls.Add($title)

$help = New-Object System.Windows.Forms.Label
$help.Text = 'Escolha uma frase com pelo menos 12 caracteres. Não será guardada no código nem no GitHub.'
$help.Location = New-Object System.Drawing.Point(30, 62)
$help.Size = New-Object System.Drawing.Size(380, 42)
$form.Controls.Add($help)

$label1 = New-Object System.Windows.Forms.Label
$label1.Text = 'Palavra-passe'
$label1.Location = New-Object System.Drawing.Point(30, 108)
$label1.AutoSize = $true
$form.Controls.Add($label1)

$password1 = New-Object System.Windows.Forms.TextBox
$password1.Location = New-Object System.Drawing.Point(30, 130)
$password1.Size = New-Object System.Drawing.Size(380, 25)
$password1.UseSystemPasswordChar = $true
$form.Controls.Add($password1)

$label2 = New-Object System.Windows.Forms.Label
$label2.Text = 'Confirmar palavra-passe'
$label2.Location = New-Object System.Drawing.Point(30, 165)
$label2.AutoSize = $true
$form.Controls.Add($label2)

$password2 = New-Object System.Windows.Forms.TextBox
$password2.Location = New-Object System.Drawing.Point(30, 187)
$password2.Size = New-Object System.Drawing.Size(380, 25)
$password2.UseSystemPasswordChar = $true
$form.Controls.Add($password2)

$errorLabel = New-Object System.Windows.Forms.Label
$errorLabel.ForeColor = [System.Drawing.Color]::FromArgb(180, 35, 24)
$errorLabel.Location = New-Object System.Drawing.Point(30, 218)
$errorLabel.Size = New-Object System.Drawing.Size(255, 35)
$form.Controls.Add($errorLabel)

$cancel = New-Object System.Windows.Forms.Button
$cancel.Text = 'Cancelar'
$cancel.Location = New-Object System.Drawing.Point(245, 252)
$cancel.Size = New-Object System.Drawing.Size(78, 32)
$cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.Controls.Add($cancel)

$confirm = New-Object System.Windows.Forms.Button
$confirm.Text = 'Criar site'
$confirm.Location = New-Object System.Drawing.Point(330, 252)
$confirm.Size = New-Object System.Drawing.Size(80, 32)
$confirm.Add_Click({
  if ($password1.Text.Length -lt 12) {
    $errorLabel.Text = 'Use pelo menos 12 caracteres.'
    return
  }
  if ($password1.Text -cne $password2.Text) {
    $errorLabel.Text = 'As palavras-passe não coincidem.'
    return
  }
  $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Close()
})
$form.Controls.Add($confirm)
$form.AcceptButton = $confirm
$form.CancelButton = $cancel

$result = $form.ShowDialog()
if ($result -ne [System.Windows.Forms.DialogResult]::OK) { exit 2 }

try {
  $env:NORTADA_BUILD_PASSWORD = $password1.Text
  & $Node (Join-Path $PSScriptRoot 'build-encrypted-site.mjs') $Source $Output
  if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar o site cifrado." }
}
finally {
  Remove-Item Env:NORTADA_BUILD_PASSWORD -ErrorAction SilentlyContinue
  $password1.Text = ''
  $password2.Text = ''
  $form.Dispose()
}

