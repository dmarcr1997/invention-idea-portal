import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

const { SystemProgram, Keypair } = web3;

let baseAccount = Keypair.generate();

const programID = new PublicKey('CB6N5rgXQvH6BbhDfzgdeTTsWqRi7fqamxSfXhHRBvHe');

const network = clusterApiUrl('devnet');

const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
	'https://media.giphy.com/media/LqW9dLVjQm3cs/giphy.gif',
	'https://media.giphy.com/media/USORjkHBNBxD6rlO0I/giphy.gif',
	'https://media.giphy.com/media/l0HlQs07WAV67eEog/giphy.gif',
	'https://media.giphy.com/media/3ohs88j0jPszpGCbYY/giphy.gif'
]
const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);
  
  const checkIfWalletIsConnected = async () => {
    if (window?.solana?.isPhantom) {
      console.log('Phantom wallet found!')
      const response = await window.solana.connect({ onlyIfTrusted: true });
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    } else {
      alert('Solana object not found! Get a Phantom Wallet 👻')
    }
  }

  const connectWallet = async () => {
    const { solana } = window;
    if(solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    } else {
      alert('No Solana!!')
    }
  };

  const onInputChange = (e) => {
    const { value } = e.target;
    setInputValue(value); 
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue);
      setGifList([...gifList, inputValue]);
      setInputValue('');
    } else {
      console.log('Empty input. Try again.');
    }
  };

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    if(gifList === null){
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else
      return (
        <div className="connected-container">
          <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
          >
            <input type="text" placeholder="Enter img/gif link!" value={inputValue} onChange={onInputChange} />
            <button type="submit" className="cta-button submit-gif-button">Submit</button>
          </form>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    }
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();
      
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
  
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  const getProgram = async () => {
    // Get metadata about your solana program
    const idl = await Program.fetchIdl(programID, getProvider());
    // Create a program that you can call
    return new Program(idl, programID, getProvider());
  };
  
  const getGifList = async() => {
    try {
      const program = await getProgram(); 
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }


  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);
  
  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 Invention Portal</p>
          <p className="sub-text">
            View your Invention collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
