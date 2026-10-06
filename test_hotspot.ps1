Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asyncOp = [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime]::GetInternetConnectionProfile()

if ($asyncOp) {
    $tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime]::CreateFromConnectionProfile($asyncOp)
    $config = $tetheringManager.GetCurrentAccessPointConfiguration()
    
    $config.Passphrase = ""
    $op = $tetheringManager.ConfigureAccessPointAsync($config)
    
    # Tunggu operasi async selesai
    [System.WindowsRuntimeSystemExtensions]::GetAwaiter($op).GetResult()
    
    $configBaru = $tetheringManager.GetCurrentAccessPointConfiguration()
    Write-Host ("SSID Baru: " + $configBaru.Ssid)
    Write-Host ("Password Baru: '" + $configBaru.Passphrase + "'")
}
