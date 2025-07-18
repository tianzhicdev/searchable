import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton
} from '@material-ui/core';
import {
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon
} from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import useComponentStyles from '../../themes/componentStyles';
import DepositComponent from '../Deposit/DepositComponent';
import { componentSpacing } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
  dialogContent: componentSpacing.dialog(theme),
  button: componentSpacing.button(theme),
  dialog: {
    '& .MuiDialog-paper': {
      [theme.breakpoints.down('sm')]: {
        margin: theme.spacing(2),
        maxHeight: '90vh'
      }
    }
  }
}));

const RefillBalanceDialog = ({
  open,
  onClose,
  currentBalance = 0,
  requiredAmount = 0
}) => {
  const classes = useComponentStyles();
  const styles = useStyles();
  const history = useHistory();
  const [depositDialogOpen, setDepositDialogOpen] = React.useState(false);
  
  const handleCreditCardRefill = () => {
    onClose();
    history.push('/credit-card-refill');
  };
  
  const handleUSDTRefill = () => {
    setDepositDialogOpen(true);
  };
  
  const handleDepositCreated = (depositData) => {
    // Don't close the deposit dialog - let the user see the QR code
    // Only close the refill balance dialog
    onClose();
  };
  
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };
  
  const neededAmount = Math.max(0, requiredAmount - currentBalance);
  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        className={styles.dialog}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" className={classes.staticText}>
              Refill Balance
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent className={styles.dialogContent}>
          <Box mb={3}>
            <Typography variant="body1" className={classes.userText} gutterBottom>
              Current Balance: {formatCurrency(currentBalance)}
            </Typography>
            <Typography variant="body1" className={classes.userText} gutterBottom>
              Required Amount: {formatCurrency(requiredAmount)}
            </Typography>
            <Typography variant="body1" className={classes.userText} style={{color: '#1976d2'}}>
              Need to refill: {formatCurrency(neededAmount)}
            </Typography>
          </Box>
          
          <Typography variant="body2" className={classes.staticText} gutterBottom>
            Choose how to refill your balance:
          </Typography>
          
          <List>
            <ListItem button onClick={handleUSDTRefill}>
              <ListItemIcon>
                <WalletIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" className={classes.staticText}>
                    Refill with USDT
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" className={classes.userText}>
                    Add balance using USDT cryptocurrency (no fees)
                  </Typography>
                }
              />
            </ListItem>
            
            <ListItem button onClick={handleCreditCardRefill}>
              <ListItemIcon>
                <CreditCardIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" className={classes.staticText}>
                    Refill with Credit Card
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" className={classes.userText}>
                    Add balance using credit/debit card (3.5% fee)
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} className={styles.button}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* USDT Deposit Dialog */}
      <DepositComponent
        open={depositDialogOpen}
        onClose={() => setDepositDialogOpen(false)}
        onDepositCreated={handleDepositCreated}
        title="Refill Balance with USDT"
        showInstructions={true}
      />
    </>
  );
};

export default RefillBalanceDialog;