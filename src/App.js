import React, { useState, useEffect, useCallback } from 'react';
import ClientNFTContract from './artifacts/contracts/ClientNFT.sol/ClientNFT.json';
import { ethers, utils, Contract } from 'ethers';

import {
  Button,
  Container,
  Grid,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Box,
  LinearProgress,
} from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';

import { makeStyles } from '@material-ui/core/styles';

const wethInterface = new utils.Interface(ClientNFTContract.abi);

// Replace this address with the contract address deployed on ethereum mainnet
const wethContractAddress = '0xe20Bc90E5d8b4276F073F8604b69AbE446Fb68d6';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
    textAlign: 'center',
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  button: {
    margin: theme.spacing(1),
  },
  title: {
    flexGrow: 1,
    textAlign: 'left',
  },
}));
const App = () => {
  const classes = useStyles();

  const [maxAmount, setMaxAmount] = useState(20);
  const [amount, setAmount] = useState(1);
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);
  const [minting, setMinting] = useState(false);
  const [showMsg, setShowMsg] = useState(false);

  const initDapp = useCallback(async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner(0);
      const instance = new Contract(wethContractAddress, wethInterface, signer);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const networkId = await window.ethereum.request({
        method: 'net_version',
      });
      console.log('networkid', networkId, typeof networkId);
      if (networkId !== '1') {
        setShowMsg(true);
        let maxMintAmount = await instance.maxMintAmount();
        console.log(maxMintAmount.toNumber());
        maxMintAmount = maxMintAmount.toNumber();
        setMaxAmount(maxMintAmount);
      }

      setAccounts(accounts);
      setContract(instance);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (networkId) => {
        console.log('networkid changed', networkId, typeof networkId);
        if (parseInt(networkId) === 1) {
          setShowMsg(false);
          initDapp();
        } else {
          setShowMsg(true);
          initDapp();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (account) => {
        console.log('account changed', account);
        setAccounts(account);
      });
    }
  }, []);

  useEffect(() => {
    initDapp();
  }, [initDapp]);

  const mint = async (isMaxAmount = false) => {
    setMinting(true);
    let amountM = amount;
    if (isMaxAmount) {
      setAmount(maxAmount);
      amountM = maxAmount;
    }
    if (isNaN(amountM) || amountM === '' || parseInt(amountM) > maxAmount) {
      setMinting(false);
      return;
    }
    try {
      let cost = await contract.cost();
      cost = utils.formatEther(cost);
      console.log('cost', cost, amountM);

      let value = utils.parseEther((Number(cost) * amountM).toString());
      value = utils.formatUnits(value, 'wei');
      console.log(value);

      console.log('acc', accounts);
      const txResponse = await contract.mint(accounts[0], amountM, { value });
      const txReceipt = await txResponse.wait();
      console.log(txReceipt);
      setMinting(false);
    } catch (error) {
      console.log(error);
      setMinting(false);
    }
  };

  return (
    <div className='App'>
      <div className={classes.root}>
        <AppBar position='static'>
          <Toolbar>
            <Typography variant='h6' className={classes.title}>
              ClientNFT
            </Typography>
          </Toolbar>
        </AppBar>
      </div>
      <Container>
        <CssBaseline />
        <Grid mt='2' container direction='row' justifyContent='center' alignItems='center'>
          <Grid item>
            <Box m={4}>
              <div className={classes.paper}>
                <Typography component='h1' variant='h5'>
                  Enter Amount (MAX {maxAmount}):
                </Typography>
                <form className={classes.form}>
                  <TextField
                    id='outlined-secondary'
                    label='Mint amount'
                    variant='outlined'
                    color='primary'
                    fullWidth
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Button
                    variant='contained'
                    color='primary'
                    disabled={minting}
                    className={classes.button}
                    onClick={() => mint()}
                  >
                    Mint
                  </Button>
                  <Button
                    variant='contained'
                    color='primary'
                    disabled={minting}
                    className={classes.button}
                    onClick={() => mint(true)}
                  >
                    Mint Max
                  </Button>
                  {minting && <LinearProgress />}
                </form>
                {showMsg && (
                  <Typography component='h1' variant='h6' color='secondary'>
                    Connect to Ethereum network!
                  </Typography>
                )}
              </div>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default App;
