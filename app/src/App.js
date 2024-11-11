import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }
    getAccounts();
  }, [account]);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.utils.parseEther(document.getElementById('ether').value);

    try {
      const escrowContract = await deploy(signer, arbiter, beneficiary, value);

      console.log("Escrow contract deployed at:", escrowContract.address);

      const escrow = {
        address: escrowContract.address,
        arbiter,
        beneficiary,
        value: ethers.utils.formatEther(value) + " Ether",
        handleApprove: async () => {
          escrowContract.once('Approved', () => {
            document.getElementById(escrowContract.address).className = 'complete';
            document.getElementById(escrowContract.address).innerText = "✓ It's been approved!";
          });
          await approve(escrowContract, signer);
        },
      };

      setEscrows([...escrows, escrow]);
    } catch (error) {
      console.error("Error deploying contract:", error);
      alert("Gagal melakukan deploy kontrak. Periksa console untuk detail.");
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1>New Contract</h1>
        <label>Arbiter Address</label>
        <input type="text" id="arbiter" />
        <label>Beneficiary Address</label>
        <input type="text" id="beneficiary" />
        <label>Deposit Amount (in Ether)</label>
        <input type="text" id="ether" />
        <div className="button" onClick={(e) => {
          e.preventDefault();
          newContract();
        }}>
          Deploy
        </div>
      </div>

      <div className="container">
        <h1>Existing Contracts</h1>
        <div>
          {escrows.map((escrow) => (
            <div key={escrow.address} className="existing-contract">
              <p><strong>Arbiter:</strong> {escrow.arbiter}</p>
              <p><strong>Beneficiary:</strong> {escrow.beneficiary}</p>
              <p><strong>Value:</strong> {escrow.value}</p>
              <div className="button" id={escrow.address} onClick={escrow.handleApprove}>
                Approve
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
