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
const SearchableItem = () => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [usdPrice, setUsdPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  const { id } = useParams();
  const account = useSelector((state) => state.account);
  const history = useHistory();
  
  const paymentCheckRef = useRef(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    fetchItemDetails();
  }, [id]);
  
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        console.log("User:", account.user);
        console.log("Item:", item);
        if (account && item && item.terminal_id === account.user._id) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    };

    if (item) {
      checkOwnership();
    }
  }, [item, account]);
  
  useEffect(() => {
    if (item && item.payloads && item.payloads.public && item.payloads.public.price) {
      convertSatsToUSD(item.payloads.public.price);
    }
  }, [item]);
  
  useEffect(() => {
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
      
      setItem(response.data);
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
    if (!item || !item.payloads.public.price) return;
    
    setCreatingInvoice(true);
    setPaymentStatus(null);
    try {
      const payload = {
        amount: item.payloads.public.price,
        currency: "SATS",
        metadata: {
          orderId: id,
          itemName: item.payloads.public.title || `Item #${item.searchable_id}`,
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
      setPaymentDialogOpen(true);
      
      checkPaymentStatus(response.data.id);
    } catch (err) {
      console.error("Error creating invoice:", err);
      alert("Failed to create payment invoice. Please try again.");
    } finally {
      setCreatingInvoice(false);
    }
  };
  
  const checkPaymentStatus = async (invoiceId) => {
    if (!invoiceId || !isMountedRef.current) return;
    
    if (!paymentCheckRef.current) {
      setCheckingPayment(true);
    }
    
    try {
      const response = await axios.get(
        `${BTC_PAY_URL}/api/v1/stores/${STORE_ID}/invoices/${invoiceId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${BTCPAY_SERVER_GREENFIELD_API_KEY}`
          }
        }
      );
      
      if (isMountedRef.current) {
        setPaymentStatus(response.data.status);
        
        if (response.data.status === 'New' || response.data.status === 'Processing') {
          paymentCheckRef.current = setTimeout(() => checkPaymentStatus(invoiceId), 5000);
        } else if (response.data.status === 'Settled' || response.data.status === 'Complete') {
          alert("Payment successful! The seller has been notified.");
          setPaymentDialogOpen(false);
          setCheckingPayment(false);
          paymentCheckRef.current = null;
        } else {
          setCheckingPayment(false);
          paymentCheckRef.current = null;
        }
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
      if (isMountedRef.current) {
        setCheckingPayment(false);
        paymentCheckRef.current = null;
      }
    }
  };
  
  const handleClosePaymentDialog = () => {
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
      
      {!loading && item && (
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
                    <Tooltip title={item.payloads.public.title || `Item #${item.searchable_id}`}>
                      <Typography variant="h4" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {item.payloads.public.title || `Item #${item.searchable_id}`}
                      </Typography>
                    </Tooltip>
                    <Divider style={{ width: '100%' }} />
                  </Box>
                </Grid>
                
                {item.payloads.public.images && item.payloads.public.images.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={1}>
                      {item.payloads.public.images.map((image, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <img 
                            src={`data:image/jpeg;base64,${image}`} 
                            alt={`${item.payloads.public.title} - image ${index + 1}`} 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
                
                <Grid item xs={12} md={item.payloads.public.images && item.payloads.public.images.length > 0 ? 6 : 12}>
                  <Grid container spacing={2}>
                    
                    {item.payloads.public && item.payloads.public.price && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Price: </span>
                          <span>{item.payloads.public.price} Sats</span>
                          
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
                    
                    {item.username && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Posted by: </span>
                          <Tooltip title={item.username}>
                            <span>{truncateText(item.username, 25)}</span>
                          </Tooltip>
                        </Typography>
                      </Grid>
                    )}

                    {item.distance && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body1">
                          <span>Distance: </span>
                          <span>{formatDistance(item.distance)}</span>
                        </Typography>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body1">
                        <span>Item ID:</span>
                        <span>{item.searchable_id}</span>
                      </Typography>
                    </Grid>
                    
                    {item.payloads.public.description && (
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
                          {item.payloads.public.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {item.payloads.public.latitude && item.payloads.public.longitude && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <span>Proposed Meeting Location:</span>
                        </Typography>
                        <Box mt={1} height="200px" width="100%" border="1px solid #ccc">
                          <iframe
                            title="Item Location"
                            width="100%"
                            height="100%"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${item.payloads.public.longitude}%2C${item.payloads.public.latitude}%2C${item.payloads.public.longitude}%2C${item.payloads.public.latitude}&layer=mapnik&marker=${item.payloads.public.latitude}%2C${item.payloads.public.longitude}&zoom=17`}
                            scrolling="no"
                            frameBorder="0"
                            style={{ pointerEvents: 'none' }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {item.payloads.public.meetupLocation && (
                      <Grid item xs={12}>
                        <Typography variant="body1">
                          <span>Meetup Location: </span>
                          <Tooltip title={item.payloads.public.meetupLocation}>
                            <span>{truncateText(item.payloads.public.meetupLocation, 50)}</span>
                          </Tooltip>
                        </Typography>
                      </Grid>
                    )}
                  
                  { item.payloads.public && item.payloads.public.price && (
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
        </Grid>
      )}

      <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="md">
        <DialogTitle>Pay with Lightning</DialogTitle>
        <DialogContent>
          {invoice ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={2}>
              <Tooltip title={item?.payloads?.public?.title || `Item #${item?.searchable_id}`}>
                <Typography variant="h6" gutterBottom>
                  {truncateText(item?.payloads?.public?.title || `Item #${item?.searchable_id}`, 40)}
                </Typography>
              </Tooltip>
              
              <Typography variant="body1" gutterBottom>
                Amount: {invoice.amount} Sats
              </Typography>
              
              {invoice.id && (
                <Box my={2} border="1px solid #ccc" p={2}>
                  <img 
                    src={`${BTC_PAY_URL}/api/v1/stores/${STORE_ID}/invoices/${invoice.id}/qrcode`} 
                    alt="Lightning Payment QR Code"
                    style={{ width: '100%', maxWidth: '300px' }}
                    onError={(e) => {
                      if (invoice.checkoutLink) {
                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invoice.checkoutLink)}`;
                      }
                    }}
                  />
                </Box>
              )}
              
              <Typography variant="body1" gutterBottom style={{ marginTop: 16 }}>
                Status: {paymentStatus || 'Waiting for payment...'}
                {/* {checkingPayment && <CircularProgress size={16} style={{ marginLeft: 8 }} />} */}
              </Typography>
              
              {invoice.checkoutLink && (
                <Button 
                  variant="contained" 
                  color="primary"
                  href={invoice.checkoutLink}
                  target="_blank"
                  style={{ marginTop: 16 }}
                >
                  Open in Lightning Wallet
                </Button>
              )}
              
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 16, textAlign: 'center' }}>
                This payment request will expire in 60 minutes. After payment, the seller will be notified automatically.
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

export default SearchableItem; 