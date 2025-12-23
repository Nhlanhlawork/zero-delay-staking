import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Clock, Zap, Lock, Unlock, CheckCircle, AlertCircle, Wallet, ArrowRight, Info } from 'lucide-react'
import './App.css'

const VAULT_ABI = [
  "function stake(uint256 amount) external",
  "function unstake() external",
  "function executeUnstake(address user) external",
  "function stakes(address) external view returns (uint256 amount, uint256 unlockTime, bool active)",
  "function canUnstake(address user) external view returns (bool)",
  "event Staked(address indexed user, uint256 amount, uint256 unlockTime)",
  "event Unstaked(address indexed user, uint256 amount, uint256 timestamp)"
]

const TOKEN_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external"
]

function App() {
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [stakeAmount, setStakeAmount] = useState('100')
  const [stakeInfo, setStakeInfo] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [status, setStatus] = useState('Not Connected')
  const [loading, setLoading] = useState(false)

const VAULT_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F"
const TOKEN_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (account && provider) {
      loadStakeInfo()
      const interval = setInterval(loadStakeInfo, 5000)
      return () => clearInterval(interval)
    }
  }, [account, provider])

  useEffect(() => {
    if (stakeInfo && stakeInfo.unlockTime > 0) {
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000)
        const remaining = Math.max(0, stakeInfo.unlockTime - now)
        setTimeRemaining(remaining)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [stakeInfo])

  async function checkConnection() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          await connectWallet()
        }
      } catch (error) {
        console.error('Error checking connection:', error)
      }
    }
  }

  async function connectWallet() {
    try {
      if (typeof window.ethereum === 'undefined') {
        setStatus('Please install MetaMask!')
        return
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      setAccount(accounts[0])
      setProvider(provider)
      setSigner(signer)
      setStatus('Connected')
      
      await loadStakeInfo()
    } catch (error) {
      console.error('Error connecting:', error)
      setStatus('Connection failed')
    }
  }

  async function loadStakeInfo() {
    if (!provider || !account) return

    try {
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider)
      const stake = await vault.stakes(account)
      
      setStakeInfo({
        amount: stake[0],
        unlockTime: Number(stake[1]),
        active: stake[2]
      })
    } catch (error) {
      console.error('Error loading stake:', error)
    }
  }

  async function handleMintTokens() {
    setLoading(true)
    setStatus('Minting tokens...')
    
    try {
      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer)
      const amount = ethers.parseEther('1000')
      const tx = await token.mint(account, amount)
      await tx.wait()
      
      setStatus('✓ Minted 1000 tokens!')
      setTimeout(() => setStatus('Connected'), 2000)
    } catch (error) {
      console.error('Error minting:', error)
      setStatus('✗ Minting failed')
    }
    
    setLoading(false)
  }

  async function handleStake() {
    setLoading(true)
    setStatus('Staking...')
    
    try {
      const amount = ethers.parseEther(stakeAmount)
      
      const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer)
      const approveTx = await token.approve(VAULT_ADDRESS, amount)
      await approveTx.wait()
      
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer)
      const stakeTx = await vault.stake(amount)
      await stakeTx.wait()
      
      setStatus('✓ Staked successfully!')
      await loadStakeInfo()
      setTimeout(() => setStatus('Connected'), 2000)
    } catch (error) {
      console.error('Error staking:', error)
      setStatus('✗ Staking failed')
    }
    
    setLoading(false)
  }

  async function handleUnstake() {
    setLoading(true)
    setStatus('Unstaking...')
    
    try {
      const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer)
      const tx = await vault.unstake()
      await tx.wait()
      
      setStatus('✓ Unstaked successfully!')
      await loadStakeInfo()
      setTimeout(() => setStatus('Connected'), 2000)
    } catch (error) {
      console.error('Error unstaking:', error)
      setStatus('✗ Unstaking failed')
    }
    
    setLoading(false)
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  return (
    <div className="App">
      <div className="container">
        <header>
          <div className="logo">
            <Zap size={40} strokeWidth={2.5} />
            <h1>InstantUnstake</h1>
          </div>
          <p className="tagline">Zero-delay unstaking powered by EIP-7702</p>
        </header>

        <div className="info-banner">
          <Info size={20} />
          <div className="info-content">
            <h3>How It Works</h3>
            <p>Stake your tokens with a time lock. When the lock expires, unstake happens <strong>instantly</strong> with zero delay using automated smart account execution.</p>
          </div>
        </div>

        <div className="status-bar">
          <div className="status-item">
            <Wallet size={18} />
            <span className="label">Status:</span>
            <span className={`value ${status.includes('✓') ? 'success' : status.includes('✗') ? 'error' : ''}`}>
              {status}
            </span>
          </div>
          {account && (
            <div className="status-item">
              <span className="label">Account:</span>
              <span className="value address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {!account ? (
          <div className="card welcome-card">
            <div className="welcome-icon">
              <Wallet size={64} strokeWidth={1.5} />
            </div>
            <h2>Get Started</h2>
            <p className="welcome-text">
              Connect your wallet to start staking with instant unstaking capability
            </p>
            <button onClick={connectWallet} className="btn btn-primary btn-large">
              <Wallet size={20} />
              Connect Wallet
            </button>
            
            <div className="features-grid">
              <div className="feature">
                <Clock size={24} />
                <span>Block-accurate timing</span>
              </div>
              <div className="feature">
                <Zap size={24} />
                <span>Instant execution</span>
              </div>
              <div className="feature">
                <Lock size={24} />
                <span>Secure staking</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!stakeInfo?.active ? (
              <div className="card">
                <div className="card-header">
                  <Lock size={24} />
                  <h2>Stake Tokens</h2>
                </div>
                
                <div className="input-group">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Amount to stake"
                    disabled={loading}
                  />
                  <span className="input-suffix">TST</span>
                </div>
                
                <div className="button-group">
                  <button 
                    onClick={handleMintTokens} 
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Get Test Tokens
                  </button>
                  <button 
                    onClick={handleStake} 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <Lock size={18} />
                    Stake Now
                  </button>
                </div>
                
                <div className="info-box">
                  <div className="info-row">
                    <Clock size={18} />
                    <span>Lock Duration: 30 seconds</span>
                  </div>
                  <div className="info-row">
                    <Zap size={18} />
                    <span>Auto-unstake enabled after lock period</span>
                  </div>
                  <div className="info-row">
                    <CheckCircle size={18} />
                    <span>Zero delay execution</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  {timeRemaining > 0 ? (
                    <>
                      <Lock size={24} />
                      <h2>Active Stake</h2>
                    </>
                  ) : (
                    <>
                      <Unlock size={24} />
                      <h2>Ready to Unstake</h2>
                    </>
                  )}
                </div>
                
                <div className="stake-info">
                  <div className="info-row-large">
                    <span className="label">Amount Staked</span>
                    <span className="value-large">
                      {ethers.formatEther(stakeInfo.amount)} TST
                    </span>
                  </div>
                  
                  <div className="info-row-large">
                    <span className="label">Unlock Time</span>
                    <span className="value">
                      {new Date(stakeInfo.unlockTime * 1000).toLocaleString()}
                    </span>
                  </div>
                  
                  {timeRemaining > 0 ? (
                    <div className="countdown">
                      <div className="countdown-header">
                        <Clock size={20} />
                        <span>Time Remaining</span>
                      </div>
                      <div className="countdown-value">{formatTime(timeRemaining)}</div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{
                            width: `${Math.max(0, 100 - (timeRemaining / 30) * 100)}%`
                          }}
                        />
                      </div>
                      <div className="auto-unstake-badge">
                        <Zap size={18} />
                        <span>Auto-unstake will execute when timer reaches zero</span>
                      </div>
                    </div>
                  ) : (
                    <div className="unlocked">
                      <div className="unlocked-badge">
                        <CheckCircle size={32} />
                        <span>Unlocked!</span>
                      </div>
                      <p className="unlocked-text">
                        Your tokens are ready for immediate withdrawal
                      </p>
                      <button 
                        onClick={handleUnstake} 
                        className="btn btn-success btn-large"
                        disabled={loading}
                      >
                        <ArrowRight size={20} />
                        Unstake Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <footer>
      
          <div className="tech-stack">
            <span>Solidity</span>
            <span>•</span>
            <span>React</span>
            <span>•</span>
            <span>Ethers.js</span>
            <span>•</span>
            <span>EIP-7702</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App