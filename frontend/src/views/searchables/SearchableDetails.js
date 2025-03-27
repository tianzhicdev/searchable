import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import configData from '../../config';
import { Grid, Typography, Button, Paper, Box, CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

const BTC_PAY_URL = "https://generous-purpose.metalseed.io";
const STORE_ID = "Gzuaf7U3aQtHKA1cpsrWAkxs3Lc5ZnKiCaA6WXMMXmDn";
const BTCPAY_SERVER_GREENFIELD_API_KEY = "b449024ea5a4c365d8631a9f00b92e9cd2f6e1f7";
const SearchableDetails = () => {
  // Item data
  const [SearchableItem, setSearchableItem] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false); // todo: maybe not use it
  const [priceLoading, setPriceLoading] = useState(false); // todo: maybe not use it
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const [checkingPayment, setCheckingPayment] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [usdPrice, setUsdPrice] = useState(null); //todo: perhaps we cache it in the backend

  
  // Payment related
  const [invoice, setInvoice] = useState(null);
  
  // Add this new state variable for payment records
  const [paymentRecords, setPaymentRecords] = useState([]);
  
  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  const paymentCheckRef = useRef(null);
  const isMountedRef = useRef(true); //todo: what?
  
  useEffect(() => {
    fetchItemDetails();
  }, [id]);
  
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        console.log("User:", account.user);
        console.log("Item:", SearchableItem);
        if (account && SearchableItem && SearchableItem.terminal_id === account.user._id) {
          setIsOwner(true);
          // Fetch payment records when we confirm the user is the owner
          fetchPaymentRecords();
        }
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };

    if (SearchableItem) {
      checkOwnership();
    }
  }, [SearchableItem, account]);
  
  useEffect(() => {
    if (SearchableItem && SearchableItem.payloads && SearchableItem.payloads.public && SearchableItem.payloads.public.price) {
      convertSatsToUSD(SearchableItem.payloads.public.price);
    }
  }, [SearchableItem]);
  
  useEffect(() => {
    // todo: what?
    return () => {
      isMountedRef.current = false;
      if (paymentCheckRef.current) {
        clearTimeout(paymentCheckRef.current);
      }
    };
  }, []);
  
  const fetchItemDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${configData.API_SERVER}searchable-item/${id}`,
        {
          headers: {
            Authorization: `${account.token}`
          }
        }
      );
      
      setSearchableItem(response.data);
    } catch (err) {
      console.error("Error fetching item details:", err);
      setError("Failed to load item details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const convertSatsToUSD = async (sats) => {
    setPriceLoading(true);
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      
      if (response.data && response.data.bitcoin && response.data.bitcoin.usd) {
        const btcPrice = response.data.bitcoin.usd;
        const usdValue = (sats / 100000000) * btcPrice;
        setUsdPrice(usdValue);
      }
    } catch (error) {
      console.error("Error fetching BTC price:", error);
    } finally {
      setPriceLoading(false);
    }
  };
  
  const createInvoice = async () => {
    if (!SearchableItem || !SearchableItem.payloads.public.price) return;
    
    setCreatingInvoice(true);
    setPaymentStatus(null);
    try {
      const payload = {
        amount: SearchableItem.payloads.public.price,
        currency: "SATS",
        metadata: {
          orderId: id,
          itemName: SearchableItem.payloads.public.title || `Item #${SearchableItem.searchable_id}`,
          buyerName: account?.user?.username || "Anonymous",
        },
        checkout: {
          expirationMinutes: 60,
          monitoringMinutes: 60,
          paymentMethods: ["BTC-LightningNetwork"],
          redirectURL: window.location.href,
        }
      };
      
      const response = await axios.post(
        `${BTC_PAY_URL}/api/v1/stores/${STORE_ID}/invoices`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${BTCPAY_SERVER_GREENFIELD_API_KEY}`
          }
        }
      );
      
      setInvoice(response.data);
      
      // Record the invoice in the backend before opening payment dialog
      await recordInvoiceInBackend(response.data.id, response.data);
      
      setPaymentDialogOpen(true);
      checkPaymentStatus(response.data.id);
    } catch (err) {
      console.error("Error creating invoice:", err);
      alert("Failed to create payment invoice. Please try again.");
    } finally {
      setCreatingInvoice(false);
    }
  };
  
  const recordInvoiceInBackend = async (invoiceId, invoiceData) => {
    try {
      await axios({
        method: 'put',
        url: `${configData.API_SERVER}kv`,
        params: {
          type: "invoice",
          pkey: invoiceId,
          fkey: id
        },
        data: {
          amount: invoiceData.amount,
          buyer: account?.user?._id || "Unknown",
          timestamp: new Date().toISOString(),
          searchable_id: SearchableItem?.searchable_id
        },
        headers: {
          Authorization: `${account.token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log("Invoice recorded successfully in backend");
    } catch (error) {
      console.error("Error recording invoice in backend:", error);
    }
  };
  
  const checkPaymentStatus = async (invoiceId) => {
    if (!invoiceId || !isMountedRef.current) return;
    
    console.log("Starting payment status check for invoice:", invoiceId);
    
    if (!paymentCheckRef.current) {
      console.log("First check, setting checkingPayment state to true");
      setCheckingPayment(true);
    }
    
    try {
      console.log("Fetching invoice data from BTCPay Server");
      const response = await axios.get(
        `${BTC_PAY_URL}/api/v1/stores/${STORE_ID}/invoices/${invoiceId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${BTCPAY_SERVER_GREENFIELD_API_KEY}`
          }
        }
      );
      
      console.log("Received payment status:", response.data.status);
      
      if (isMountedRef.current) {
        console.log("Component still mounted, updating payment status state");
        setPaymentStatus(response.data.status);
        
        if (response.data.status === 'New' || response.data.status === 'Processing') {
          console.log("Payment still in progress, scheduling next check in 2 seconds");
          paymentCheckRef.current = setTimeout(() => checkPaymentStatus(invoiceId), 3000);
        } else if (response.data.status === 'Settled' || response.data.status === 'Complete') {
          console.log("Payment completed successfully, recording in backend");
          await recordPaymentInBackend(invoiceId, response.data); // todo: backend should be checking for payment status
          
          console.log("Notifying user and cleaning up payment UI");
          alert("Payment successful! The seller has been notified.");
          setPaymentDialogOpen(false);
        } else {
          console.log("Payment in final state (not successful)");
        }
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      if (isMountedRef.current) {
        console.log("Error occurred, cleaning up payment check");
      }
    } finally {
      setCheckingPayment(false);
      paymentCheckRef.current = null;
    }
    
  };
  
  const recordPaymentInBackend = async (invoiceId, invoiceData) => {
    try {
      await axios({
        method: 'put',
        url: `${configData.API_SERVER}kv`,
        params: {
          type: "payment",
          pkey: invoiceId,
          fkey: id
        },
        data: {
          // TODO: add visiter id or somehting for visitors to keep track of them
          amount: invoiceData.amount,
          status: invoiceData.status,
          buyer_id: account?.user?.id || null,
          timestamp: new Date().toISOString(),
          searchable_id: SearchableItem?.searchable_id
        },
        headers: {
          Authorization: `${account.token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log("Payment recorded successfully in backend");
    } catch (error) {
      console.error("Error recording payment in backend:", error);
    }
  };
  
  const handleClosePaymentDialog = () => {
    // Log payment dialog closing
    console.log("Closing payment dialog");
    
    // If there's an invoice, log its details
    if (invoice) {
      console.log("Abandoning invoice:", invoice.id);
    }
    if (paymentCheckRef.current) {
      clearTimeout(paymentCheckRef.current);
      paymentCheckRef.current = null;
    }
    setPaymentDialogOpen(false);
    setInvoice(null);
    setPaymentStatus(null);
    setCheckingPayment(false);
  };
  
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };
  
  const formatUSD = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };
  
  const handleRemoveItem = async () => {
    if (!window.confirm("Are you sure you want to remove this item?")) {
      return;
    }
    
    setIsRemoving(true);
    try {
      await axios.put(
        `${configData.API_SERVER}remove-searchable-item/${id}`,
        {},
        {
          headers: {
            Authorization: `${account.token}`
          }
        }
      );
      alert("Item removed successfully");
      history.push('/searchables');
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove the item");
    } finally {
      setIsRemoving(false);
    }
  };
  
  // Helper function to truncate text
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  // Add this new function to fetch payment records
  const fetchPaymentRecords = async () => {
    try {
      const response = await axios.get(
        `${configData.API_SERVER}kv`,
        {
          params: {
            type: "payment",
            fkey: id
          },
          headers: {
            Authorization: `${account.token}`
          }
        }
      );
      
      console.log("Payment records:", response.data);
      setPaymentRecords(response.data.data || []);
    } catch (error) {
      console.error("Error fetching payment records:", error);
    }
  };
  
  // Add this function to format the timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  };
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box mb={2}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => history.goBack()}
            >
              <ChevronLeftIcon /> 
            </Button>
        </Box>
      </Grid>
      
      {loading && (
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </Grid>
      )}
      
      {error && (
        <Grid item xs={12}>
          <Paper>
            <Typography variant="body1">{error}</Typography>
          </Paper>
        </Grid>
      )}
      
      {!loading && SearchableItem && (
        <Grid item xs={12}>
        <Paper elevation={3}>
        <Grid item xs={12}>
            <Box p={3}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      '@media (max-width:600px)': {
                        padding: '8px',
                      },
                    }}
                  >
                    <Tooltip title={SearchableItem.payloads.public.title || `Item #${SearchableItem.searchable_id}`}>
                      <Typography variant="h4" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {SearchableItem.payloads.public.title || `Item #${SearchableItem.searchable_id}`}
                      </Typography>
                    </Tooltip>
                    <Divider style={{ width: '100%' }} />
                  </Box>
                </Grid>
                
                {SearchableItem.payloads.public.images && SearchableItem.payloads.public.images.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={1}>
                      {SearchableItem.payloads.public.images.map((image, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <img 
                            src={`data:image/jpeg;base64,${image}`} 
                            alt={`${SearchableItem.payloads.public.title} - image ${index + 1}`} 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
                
                <Grid item xs={12} md={SearchableItem.payloads.public.images && SearchableItem.payloads.public.images.length > 0 ? 6 : 12}>
                  <Grid container spacing={2}>
                    
                    {SearchableItem.payloads.public && SearchableItem.payloads.public.price && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Price: </span>
                          <span>{SearchableItem.payloads.public.price} Sats</span>
                          
                          {usdPrice !== null && (
                            <Typography variant="body2" style={{ marginTop: 4 }}>
                              {priceLoading ? (
                                <CircularProgress size={12} style={{ marginLeft: 8 }} />
                              ) : (
                                `≈ ${formatUSD(usdPrice)}`
                              )}
                            </Typography>
                          )}
                        </Typography>
                      </Grid>
                    )}
                    
                    {SearchableItem.username && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Posted by: </span>
                          <Tooltip title={SearchableItem.username}>
                            <span>{truncateText(SearchableItem.username, 25)}</span>
                          </Tooltip>
                        </Typography>
                      </Grid>
                    )}

                    {SearchableItem.distance && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Distance: </span>
                          <span>{formatDistance(SearchableItem.distance)}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <span>Item ID:</span>
                        <span>{SearchableItem.searchable_id}</span>
                      </Typography>
                    </Grid>
                    
                    {SearchableItem.payloads.public.description && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          Description:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          style={{ 
                            whiteSpace: 'pre-line', 
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word' 
                          }}
                        >
                          {SearchableItem.payloads.public.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {SearchableItem.payloads.public.latitude && SearchableItem.payloads.public.longitude && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <span>Proposed Meeting Location:</span>
                        </Typography>
                        <Box mt={1} height="200px" width="100%" border="1px solid #ccc">
                          <iframe
                            title="Item Location"
                            width="100%"
                            height="100%"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${SearchableItem.payloads.public.longitude}%2C${SearchableItem.payloads.public.latitude}%2C${SearchableItem.payloads.public.longitude}%2C${SearchableItem.payloads.public.latitude}&layer=mapnik&marker=${SearchableItem.payloads.public.latitude}%2C${SearchableItem.payloads.public.longitude}&zoom=17`}
                            scrolling="no"
                            frameBorder="0"
                            style={{ pointerEvents: 'none' }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {SearchableItem.payloads.public.meetupLocation && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <span>Meetup Location: </span>
                          <Tooltip title={SearchableItem.payloads.public.meetupLocation}>
                            <span>{truncateText(SearchableItem.payloads.public.meetupLocation, 50)}</span>
                          </Tooltip>
                        </Typography>
                      </Grid>
                    )}
                  
                  { SearchableItem.payloads.public && SearchableItem.payloads.public.price && (
                    <Grid item xs={12}>
                      <Box mt={3} display="flex" justifyContent="center">
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={createInvoice}
                          disabled={creatingInvoice}
                        >
                          {creatingInvoice ? (
                            <CircularProgress size={24} />
                          ) : (
                            "Pay with Lightning"
                          )}
                        </Button>
                      </Box>
                    </Grid>
                  )}
                  
                  {isOwner && (
                    <Grid item xs={12}>
                      <Box mt={3} display="flex" justifyContent="center">
                        <Button
                          variant="contained"
                          onClick={handleRemoveItem}
                          disabled={isRemoving}
                        >
                          Remove Item
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Box>
        </Grid>
        </Paper>
        
        {isOwner && (
          <Paper sx={{ marginTop: 2, padding: 2 }}>
            <Box p={2}>
              <Typography variant="h5" gutterBottom>
                Payment Records
              </Typography>
              {paymentRecords.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Invoice ID</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentRecords.map((record) => (
                        <tr key={record.pkey}>
                          <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{record.pkey}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{record.status || 'Unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Typography variant="body1">No payment records found.</Typography>
              )}
            </Box>
          </Paper>
        )}
        </Grid>
      )}

      <Dialog open={paymentDialogOpen} maxWidth="md">
        <DialogTitle>Lightning Network Payment</DialogTitle>
        <DialogContent>
          {invoice ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={2}>
                <Typography variant="h6" gutterBottom>
                  {truncateText(SearchableItem?.payloads?.public?.title || `Item #${SearchableItem?.searchable_id}`, 40)}
                </Typography>
              
              <Typography variant="body1" gutterBottom>
                Amount: {invoice.amount} Sats
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                Invoice ID: {invoice.id.substring(0, 3).toUpperCase()}
              </Typography>
              
              {paymentStatus && (
                <Typography variant="body1" gutterBottom style={{ marginTop: 16 }}>
                  Status: {paymentStatus}
                  {/* {checkingPayment && <CircularProgress size={16} style={{ marginLeft: 8 }} />} */}
                </Typography>
              )}
              
              {invoice.checkoutLink && (
                <Button 
                  variant="contained" 
                  color="primary"
                  href={invoice.checkoutLink}
                  target="_blank"
                  style={{ marginTop: 16 }}
                >
                  Pay with ⚡
                </Button>
              )}
              
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 16, textAlign: 'center' }}>
                This payment is irreversible.
              </Typography>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default SearchableDetails; 