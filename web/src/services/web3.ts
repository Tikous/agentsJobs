import { ethers } from 'ethers';

// 更新合约ABI以匹配实际的SimpleJobContract
const CONTRACT_ABI = [
  "event JobPosted(uint256 jobId, address publisher)",
  "event PaymentMade(uint256 jobId, address agent, uint256 amount)",
  "event RefundMade(uint256 jobId, address publisher, uint256 amount)",
  "function stakeAndPostJob() external",
  "function payAgent(uint256 _jobId, address _agent, uint256 _amount) external",
  "function refundRemaining(uint256 _jobId) external",
  "function getJob(uint256 _jobId) external view returns (address, uint256, bool)",
  "function jobCounter() external view returns (uint256)",
  "function STAKE_AMOUNT() external view returns (uint256)"
];

// 添加USDT合约ABI
const USDT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function faucet() external"
];

const CONTRACT_ADDRESS = "0xd529550244a31D2185917b5368bD6913a41e4778";
// USDT合约地址 - 需要部署MockUSDT合约后设置正确的地址
const USDT_CONTRACT_ADDRESS = "0x9bD4E017b8fB6cC50218495b28833420C33bfb22";

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contract: ethers.Contract | null = null;
  private usdtContract: ethers.Contract | null = null;
  
  // 临时存储：前端JobId到合约JobId的映射
  private readonly JOB_MAPPING_KEY = 'job_contract_mapping';

  // 检查是否支持MetaMask
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  // 连接钱包
  async connectWallet(): Promise<{ address: string; balance: string }> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('请安装MetaMask钱包');
    }

    try {
      // 请求连接钱包
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // 创建provider和signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // 创建合约实例
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      this.usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, this.signer);
      
      // 获取地址和余额
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      
      return {
        address,
        balance: ethers.formatEther(balance)
      };
    } catch (error) {
      console.error('连接钱包失败:', error);
      throw new Error('连接钱包失败');
    }
  }

  // 获取当前连接的钱包地址
  async getConnectedAddress(): Promise<string | null> {
    if (!this.signer) {
      return null;
    }
    return await this.signer.getAddress();
  }

  // 获取钱包余额
  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('钱包未连接');
    }
    
    const targetAddress = address || await this.signer!.getAddress();
    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  // 获取USDT余额
  async getUSDTBalance(address?: string): Promise<string> {
    if (!this.usdtContract || !this.signer) {
      throw new Error('合约未初始化');
    }
    
    const targetAddress = address || await this.signer.getAddress();
    const balance = await this.usdtContract.balanceOf(targetAddress);
    const decimals = await this.usdtContract.decimals();
    return ethers.formatUnits(balance, decimals);
  }

  // 检查USDT余额是否足够
  async checkUSDTBalance(requiredAmount: string): Promise<boolean> {
    if (!this.signer) {
      throw new Error('钱包未连接');
    }
    
    const address = await this.signer.getAddress();
    const balance = await this.getUSDTBalance(address);
    
    return parseFloat(balance) >= parseFloat(requiredAmount);
  }

  // 获取质押金额(从合约读取)
  async getStakeAmount(): Promise<string> {
    if (!this.contract) {
      throw new Error('合约未初始化');
    }
    
    const stakeAmount = await this.contract.STAKE_AMOUNT();
    return stakeAmount.toString();
  }

  // 批准USDT支出
  async approveUSDT(amount: string): Promise<string> {
    if (!this.usdtContract) {
      throw new Error('USDT合约未初始化');
    }

    try {
      console.log(`批准USDT支出: ${amount}`);
      const decimals = await this.usdtContract.decimals();
      const amountBigInt = ethers.parseUnits(amount, decimals);
      
      const tx = await this.usdtContract.approve(CONTRACT_ADDRESS, amountBigInt);
      console.log(`批准交易已发送: ${tx.hash}`);
      
      await tx.wait();
      console.log(`批准交易已确认: ${tx.hash}`);
      
      return tx.hash;
    } catch (error) {
      console.error('批准USDT支出失败:', error);
      throw new Error('批准USDT支出失败');
    }
  }

  // 创建Job时质押资金到合约 - 修正方法名和逻辑
  async stakeAndPostJob(frontendJobId?: string): Promise<{ txHash: string; jobId: string }> {
    if (!this.contract || !this.usdtContract) {
      throw new Error('合约未初始化，请先连接钱包');
    }

    if (!this.signer) {
      throw new Error('钱包未连接');
    }

    try {
      console.log('开始质押并发布任务...');
      
      // 1. 获取质押金额
      const stakeAmount = await this.getStakeAmount();
      console.log(`质押金额: ${stakeAmount}`);
      
      // 2. 检查USDT余额
      const usdtBalance = await this.getUSDTBalance();
      const decimals = await this.usdtContract.decimals();
      const stakeAmountFormatted = ethers.formatUnits(stakeAmount, decimals);
      
      console.log(`USDT余额: ${usdtBalance}, 需要质押: ${stakeAmountFormatted}`);
      
      if (parseFloat(usdtBalance) < parseFloat(stakeAmountFormatted)) {
        throw new Error(`USDT余额不足。当前余额: ${usdtBalance} USDT，需要: ${stakeAmountFormatted} USDT`);
      }
      
      // 3. 检查并批准USDT支出
      const allowance = await this.usdtContract.allowance(
        await this.signer.getAddress(), 
        CONTRACT_ADDRESS
      );
      
      if (allowance < stakeAmount) {
        console.log('需要先批准USDT支出...');
        await this.approveUSDT(stakeAmountFormatted);
      }
      
      // 4. 调用合约的stakeAndPostJob函数
      console.log('调用合约stakeAndPostJob函数...');
      const tx = await this.contract.stakeAndPostJob();
      console.log(`交易已发送: ${tx.hash}`);
      
      console.log('等待交易确认...');
      const receipt = await tx.wait();
      console.log(`交易已确认: ${receipt.transactionHash}`);
      
      // 5. 从事件中获取jobId
      const jobPostedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === 'JobPosted';
        } catch {
          return false;
        }
      });
      
      let jobId = '';
      if (jobPostedEvent) {
        const parsed = this.contract.interface.parseLog(jobPostedEvent);
        jobId = parsed?.args[0].toString() || '';
        console.log(`获取到JobId: ${jobId}`);
      }
      
      // 如果提供了前端JobId，保存映射关系
      if (frontendJobId && jobId) {
        this.saveJobMapping(frontendJobId, jobId, tx.hash);
      }
      
      return {
        txHash: tx.hash,
        jobId
      };
    } catch (error: any) {
      console.error('质押和发布任务失败详细错误:', error);
      
      // 提供更详细的错误信息
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('余额不足以支付交易费用');
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        throw new Error('合约调用失败，可能是合约地址无效或网络问题');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('网络连接失败，请检查网络设置');
      } else if (error.message?.includes('user rejected')) {
        throw new Error('用户取消了交易');
      } else {
        throw new Error(`质押和发布任务失败: ${error.message || error.toString()}`);
      }
    }
  }

  // Job完成后支付给Agent
  async payAgent(contractJobId: string, agentAddress: string, amount: string): Promise<string> {
    if (!this.contract) {
      throw new Error('合约未初始化');
    }

    try {
      console.log(`支付给Agent: contractJobId=${contractJobId}, agent=${agentAddress}, amount=${amount}`);
      
      // 将contractJobId转换为数字
      const jobIdNumber = parseInt(contractJobId);
      if (isNaN(jobIdNumber)) {
        throw new Error(`无效的合约JobId: ${contractJobId}`);
      }
      
      // 将字符串转换为数字，然后转换为适当的单位
      const amountBigInt = ethers.parseUnits(amount, 6); // USDT是6位小数
      
      // 调用合约的payAgent函数
      const tx = await this.contract.payAgent(jobIdNumber, agentAddress, amountBigInt);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('支付给Agent失败:', error);
      throw new Error('支付给Agent失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 退还剩余资金给Job发布者
  async refundPublisher(contractJobId: string): Promise<string> {
    if (!this.contract) {
      throw new Error('合约未初始化');
    }

    try {
      console.log(`退还剩余资金: contractJobId=${contractJobId}`);
      
      // 将contractJobId转换为数字
      const jobIdNumber = parseInt(contractJobId);
      if (isNaN(jobIdNumber)) {
        throw new Error(`无效的合约JobId: ${contractJobId}`);
      }
      
      // 调用合约的refundRemaining函数
      const tx = await this.contract.refundRemaining(jobIdNumber);
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      console.error('退款失败:', error);
      throw new Error('退款失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 获取Job信息
  async getJobInfo(contractJobId: string): Promise<{ publisher: string; stakedAmount: string; completed: boolean }> {
    if (!this.contract) {
      throw new Error('合约未初始化');
    }

    try {
      // 将contractJobId转换为数字
      const jobIdNumber = parseInt(contractJobId);
      if (isNaN(jobIdNumber)) {
        throw new Error(`无效的合约JobId: ${contractJobId}`);
      }
      
      const [publisher, stakedAmount, completed] = await this.contract.getJob(jobIdNumber);
      return {
        publisher,
        stakedAmount: ethers.formatUnits(stakedAmount, 6), // USDT是6位小数
        completed
      };
    } catch (error) {
      console.error('获取Job信息失败:', error);
      throw new Error('获取Job信息失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 监听合约事件
  onJobPosted(callback: (jobId: string, publisher: string) => void) {
    if (!this.contract) return;
    
    this.contract.on('JobPosted', (jobId, publisher) => {
      callback(jobId.toString(), publisher);
    });
  }

  onPaymentMade(callback: (jobId: string, agent: string, amount: string) => void) {
    if (!this.contract) return;
    
    this.contract.on('PaymentMade', (jobId, agent, amount) => {
      callback(jobId.toString(), agent, ethers.formatUnits(amount, 6));
    });
  }

  onRefundMade(callback: (jobId: string, publisher: string, amount: string) => void) {
    if (!this.contract) return;
    
    this.contract.on('RefundMade', (jobId, publisher, amount) => {
      callback(jobId.toString(), publisher, ethers.formatUnits(amount, 6));
    });
  }

  // 获取测试USDT (调用faucet)
  async getTestUSDT(): Promise<string> {
    if (!this.usdtContract) {
      throw new Error('USDT合约未初始化');
    }

    try {
      console.log('正在获取测试USDT...');
      const tx = await this.usdtContract.faucet();
      console.log(`测试USDT交易已发送: ${tx.hash}`);
      
      await tx.wait();
      console.log(`测试USDT交易已确认: ${tx.hash}`);
      
      return tx.hash;
    } catch (error) {
      console.error('获取测试USDT失败:', error);
      throw new Error('获取测试USDT失败');
    }
  }

  // 保存JobId映射
  private saveJobMapping(frontendJobId: string, contractJobId: string, txHash: string) {
    try {
      const mappings = this.getJobMappings();
      mappings[frontendJobId] = { contractJobId, txHash, timestamp: Date.now() };
      localStorage.setItem(this.JOB_MAPPING_KEY, JSON.stringify(mappings));
      console.log(`已保存JobId映射: ${frontendJobId} -> ${contractJobId}`);
    } catch (error) {
      console.error('保存JobId映射失败:', error);
    }
  }

  // 获取所有JobId映射
  private getJobMappings(): Record<string, { contractJobId: string; txHash: string; timestamp: number }> {
    try {
      const stored = localStorage.getItem(this.JOB_MAPPING_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('读取JobId映射失败:', error);
      return {};
    }
  }

  // 获取合约JobId
  getContractJobId(frontendJobId: string): string | null {
    const mappings = this.getJobMappings();
    return mappings[frontendJobId]?.contractJobId || null;
  }

  // 清理过期的映射（保留7天）
  private cleanExpiredMappings() {
    try {
      const mappings = this.getJobMappings();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      let hasChanges = false;
      Object.keys(mappings).forEach(key => {
        if (mappings[key].timestamp < sevenDaysAgo) {
          delete mappings[key];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        localStorage.setItem(this.JOB_MAPPING_KEY, JSON.stringify(mappings));
      }
    } catch (error) {
      console.error('清理过期映射失败:', error);
    }
  }

  // 断开钱包连接
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.usdtContract = null;
    // 清理过期的映射
    this.cleanExpiredMappings();
  }
}

// 创建单例实例
export const web3Service = new Web3Service();

// TypeScript类型声明
declare global {
  interface Window {
    ethereum?: any;
  }
}