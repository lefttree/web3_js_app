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
    handleChange: any,
    transactions: any,
    isLoading: boolean
};

const defaultState = {
    connectWallet: () => {},
    connectedAccount: "",
    formData: {},
    sendTransaction: () => {},
    handleChange: () => {},
    transactions: [],
    isLoading: false,
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
    const [transactions, setTransactions] = useState([]);

    const handleChange = (e: any, name: any) => {
        setFormData((prevState) => ({...prevState, [name]: e.target.value}));
    }

    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert("please install metamask");

            const transactionContract = getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();

            console.log(availableTransactions);

            const structuredTransactions = availableTransactions.map((transaction: any) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18)
            }));

            console.log(structuredTransactions);

            setTransactions(structuredTransactions);
        } catch(error) {
            console.log(error);
        }
    }

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("please install metamask");

            const accounts = await ethereum.request({ method: 'eth_accounts' });

            if(accounts.length) {
                setConnectedAccount(accounts[0]);

                getAllTransactions();
            } else {
                console.log("No account found");
            }

            console.log(accounts);
        } catch(error) {
            console.log(error);

            throw new Error("No ethereum object.");
        }
    }

    const checkIfTransactionsExist = async () => {
        try {
            const transactionContract = getEthereumContract();
            const transactionCount = await transactionContract.getTransactionCount();

            console.log({
                transactionCount
            });

            window.localStorage.setItem("transactionCount", transactionCount);

        } catch(error) {
            console.log(error);
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
        checkIfTransactionsExist();
    }, []);

    return (
        <TransactionContext.Provider value={{ connectWallet, connectedAccount, formData, sendTransaction, handleChange, transactions, isLoading }}>
            {children}
        </TransactionContext.Provider>
    )
}