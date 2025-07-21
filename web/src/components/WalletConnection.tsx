import React, { useState, useEffect } from 'react';
import { Button, Card, Descriptions, message, Space, Tag } from 'antd';
import { WalletOutlined, DisconnectOutlined, GiftOutlined } from '@ant-design/icons';
import { web3Service } from '@/services/web3';

interface WalletConnectionProps {
  onWalletConnect?: (address: string, balance: string) => void;
  onWalletDisconnect?: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({
  onWalletConnect,
  onWalletDisconnect
}) => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [usdtBalance, setUsdtBalance] = useState<string>('0');
  const [connecting, setConnecting] = useState(false);
  const [gettingTestUSDT, setGettingTestUSDT] = useState(false);

  // 检查是否已连接钱包
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      if (web3Service.isMetaMaskInstalled()) {
        const connectedAddress = await web3Service.getConnectedAddress();
        if (connectedAddress) {
          const walletBalance = await web3Service.getBalance(connectedAddress);
          setAddress(connectedAddress);
          setBalance(walletBalance);
          setConnected(true);
          
          // 尝试获取USDT余额
          try {
            const usdtBal = await web3Service.getUSDTBalance(connectedAddress);
            setUsdtBalance(usdtBal);
          } catch (error) {
            console.log('获取USDT余额失败，可能USDT合约未配置:', error);
            setUsdtBalance('N/A');
          }
          
          if (onWalletConnect) {
            onWalletConnect(connectedAddress, walletBalance);
          }
        }
      }
    } catch (error) {
      console.error('检查钱包连接失败:', error);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const walletInfo = await web3Service.connectWallet();
      setAddress(walletInfo.address);
      setBalance(walletInfo.balance);
      setConnected(true);
      
      // 尝试获取USDT余额
      try {
        const usdtBal = await web3Service.getUSDTBalance(walletInfo.address);
        setUsdtBalance(usdtBal);
      } catch (error) {
        console.log('获取USDT余额失败，可能USDT合约未配置:', error);
        setUsdtBalance('N/A');
      }
      
      message.success('钱包连接成功！');
      
      if (onWalletConnect) {
        onWalletConnect(walletInfo.address, walletInfo.balance);
      }
    } catch (error) {
      message.error('连接钱包失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    web3Service.disconnect();
    setConnected(false);
    setAddress('');
    setBalance('0');
    setUsdtBalance('0');
    
    message.info('钱包已断开连接');
    
    if (onWalletDisconnect) {
      onWalletDisconnect();
    }
  };

  const refreshBalance = async () => {
    if (connected && address) {
      try {
        const newBalance = await web3Service.getBalance(address);
        setBalance(newBalance);
        
        // 同时更新USDT余额
        try {
          const newUsdtBalance = await web3Service.getUSDTBalance(address);
          setUsdtBalance(newUsdtBalance);
        } catch (error) {
          console.log('获取USDT余额失败:', error);
        }
        
        message.success('余额已刷新');
      } catch (error) {
        message.error('刷新余额失败');
      }
    }
  };

  const handleGetTestUSDT = async () => {
    if (!connected) {
      message.error('请先连接钱包');
      return;
    }

    setGettingTestUSDT(true);
    try {
      await web3Service.getTestUSDT();
      message.success('成功获取1000 USDT测试代币！');
      
      // 刷新USDT余额
      setTimeout(async () => {
        try {
          const newUsdtBalance = await web3Service.getUSDTBalance(address);
          setUsdtBalance(newUsdtBalance);
        } catch (error) {
          console.log('刷新USDT余额失败:', error);
        }
      }, 2000);
    } catch (error) {
      message.error('获取测试USDT失败: ' + (error instanceof Error ? error.message : '未知错误'));
      console.error('Get test USDT error:', error);
    } finally {
      setGettingTestUSDT(false);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!web3Service.isMetaMaskInstalled()) {
    return (
      <Card size="small" style={{ marginBottom: '16px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <WalletOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#ccc' }} />
          <div>请安装 MetaMask 钱包</div>
          <Button 
            type="primary" 
            style={{ marginTop: '8px' }}
            onClick={() => window.open('https://metamask.io/', '_blank')}
          >
            安装 MetaMask
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <WalletOutlined />
          <span>钱包连接</span>
        </Space>
      }
      size="small" 
      style={{ marginBottom: '16px' }}
      extra={
        connected ? (
          <Button 
            type="text" 
            size="small" 
            icon={<DisconnectOutlined />}
            onClick={handleDisconnect}
            danger
          >
            断开
          </Button>
        ) : null
      }
    >
      {connected ? (
        <Descriptions size="small" column={1}>
          <Descriptions.Item label="钱包地址">
            <Space>
              <Tag color="blue">{formatAddress(address)}</Tag>
              <Button type="link" size="small" onClick={() => navigator.clipboard.writeText(address)}>
                复制完整地址
              </Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="ETH余额">
            <Space>
              <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                {parseFloat(balance).toFixed(4)} ETH
              </span>
              <Button type="link" size="small" onClick={refreshBalance}>
                刷新
              </Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="USDT余额">
            <Space>
              <span style={{ fontWeight: 'bold', color: '#faad14' }}>
                {usdtBalance === 'N/A' ? 'N/A' : `${parseFloat(usdtBalance || '0').toFixed(2)} USDT`}
              </span>
              {usdtBalance !== 'N/A' && parseFloat(usdtBalance || '0') < 1000 && (
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<GiftOutlined />}
                  loading={gettingTestUSDT}
                  onClick={handleGetTestUSDT}
                  style={{ fontSize: '12px' }}
                >
                  获取测试USDT
                </Button>
              )}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <WalletOutlined style={{ fontSize: '32px', marginBottom: '12px', color: '#1890ff' }} />
          <div style={{ marginBottom: '12px' }}>连接您的钱包以开始使用</div>
          <Button 
            type="primary" 
            loading={connecting}
            onClick={handleConnect}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            {connecting ? '连接中...' : '连接钱包'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default WalletConnection;