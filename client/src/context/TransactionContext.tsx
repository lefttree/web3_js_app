import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constant';
import { TransactionDescription } from 'ethers/lib/utils';

declare var window: any

// This is how typescript create context, you need to specify the types
interface ITransactionContext {
    connectWallet?: () => void,
    connectedAccount: string
    formData: any,
    sendTransaction: any,
    handleChange: any
};

const defaultState = {
    connectWallet: () => {},
    connectedAccount: "",
    formData: {},
    sendTransaction: () => {},
    handleChange: () => {},
};

export const TransactionContext = React.createContext<ITransactionContext>(defaultState);

const { ethereum } = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

    console.log({
        provider,
        signer,
        transactionContract
    });

    return transactionContract;
}

export const TransactionProvider = ({ children }: {children: any}) => {
    const [connectedAccount, setConnectedAccount] = useState("");
    const [formData, setFormData ] = useState({
        addressTo: '',
        amount: '',
        keyword: '',
        message: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [ transactionCount, setTransactionCount ] = useState(localStorage.getItem('transactionCount'));

    const handleChange = (e: any, name: any) => {
        setFormData((prevState) => ({...prevState, [name]: e.target.value}));
    }

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("please install metamask");

            const accounts = await ethereum.request({ method: 'eth_accounts' });

            if(accounts.length) {
                setConnectedAccount(accounts[0]);

                // getAllTransactions();
            } else {
                console.log("No account found");
            }

            console.log(accounts);
        } catch(error) {
            console.log(error);

            throw new Error("No ethereum object.");
        }
    }

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("please install metamask");

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        
            setConnectedAccount(accounts[0]);
        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object.");
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert("please install metamask");

            // get data from the form
            const {addressTo, amount, keyword, message } = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);

            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: connectedAccount,
                    to: addressTo,
                    gas: '0x5208', // 21000 GWEI
                    value: parsedAmount._hex, // 0.00001 is decimal
                }]
            })

            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait()
            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionCount();

            setTransactionCount(transactionCount.toNumber());

        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object.");
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    return (
        <TransactionContext.Provider value={{ connectWallet, connectedAccount, formData, sendTransaction, handleChange }}>
            {children}
        </TransactionContext.Provider>
    )
}