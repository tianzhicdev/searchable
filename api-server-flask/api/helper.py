HOST = "generous-purpose.metalseed.io"

import os
PASSWORD = os.environ.get('BTCPAY_SERVER_SSH_PASSWORD', 'password')
print(PASSWORD)

import paramiko
import json
import requests

def pay_lightning_invoice(invoice, decode_only=False):
    """
    Pay a Lightning Network invoice via BTCPay Server
    
    Args:
        invoice: The lightning invoice to pay
        decode_only: If True, only decode the invoice without paying
        
    Returns:
        dict: The payment response with status information
    """
    try:
        # First, decode the invoice to get its details
        decode_response = requests.get(
            f"{BTC_PAY_URL}/api/v1/stores/{STORE_ID}/lightning/BTC/invoices/decode",
            params={"cryptoCode": "BTC", "lightning": invoice},
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'token {BTCPAY_SERVER_GREENFIELD_API_KEY}'
            }
        )
        
        if decode_response.status_code != 200:
            raise Exception(f"Failed to decode invoice: {decode_response.text}")
            
        invoice_details = decode_response.json()
        
        # If we only want to decode, return the invoice details
        if decode_only:
            return invoice_details
        
        # Otherwise, proceed with payment
        response = requests.post(
            f"{BTC_PAY_URL}/api/v1/stores/{STORE_ID}/lightning/BTC/payments",
            json={"BOLT11": invoice},
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'token {BTCPAY_SERVER_GREENFIELD_API_KEY}'
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to pay invoice: {response.text}")
            
        payment_data = response.json()
        return payment_data
    except Exception as e:
        print(f"Error paying Lightning invoice: {str(e)}")
        raise

# root@generous-purpose:~/btcpayserver-docker# docker exec -it btcpayserver_lnd_bitcoin lncli --macaroonpath=/data/admin.macaroon  --network=mainnet payinvoice lnbc110n1pn7tmsjdqdgdshx6pqg9c8qpp5vjrx2jdtch5pzchxjgpudj8rv6dqpmf82eat72gax90rwzhzgkpqsp55370guh6xgeultfq5zxpckh8s3rcgx4fwfjyxydhaqc26xzz5sps9qrsgqcqpcxqy8ayqrzjqv06k0m23t593pngl0jt7n9wznp64fqngvctz7vts8nq4tukvtljqzhvysqqvncqqqqqqqqqqqqqqqqq9grzjqtsjy9p55gdceevp36fvdmrkxqvzfhy8ak2tgc5zgtjtra9xlaz97zy63gqqtdsqquqqqqqqqqqqqqqq9gxkrff8daffd2avqnm06jx3p3hnweegwjkkje28v42vapjs5ywtsrxdectws25qzm2dxc85dql8k8vau969z39294cz7c4atgdaukejgq7wt57s -f --json
# {
#     "payment_hash": "64866549abc5e81162e69203c6c8e3669a00ed27567abf291d315e370ae24582",
#     "value": "11",
#     "creation_date": "1743121999",
#     "fee": "2",
#     "payment_preimage": "566ef7444a3371286edd6a47dfba660514a2e6f3a1b6e20f56f4c102399df398",
#     "value_sat": "11",
#     "value_msat": "11000",
#     "payment_request": "lnbc110n1pn7tmsjdqdgdshx6pqg9c8qpp5vjrx2jdtch5pzchxjgpudj8rv6dqpmf82eat72gax90rwzhzgkpqsp55370guh6xgeultfq5zxpckh8s3rcgx4fwfjyxydhaqc26xzz5sps9qrsgqcqpcxqy8ayqrzjqv06k0m23t593pngl0jt7n9wznp64fqngvctz7vts8nq4tukvtljqzhvysqqvncqqqqqqqqqqqqqqqqq9grzjqtsjy9p55gdceevp36fvdmrkxqvzfhy8ak2tgc5zgtjtra9xlaz97zy63gqqtdsqquqqqqqqqqqqqqqq9gxkrff8daffd2avqnm06jx3p3hnweegwjkkje28v42vapjs5ywtsrxdectws25qzm2dxc85dql8k8vau969z39294cz7c4atgdaukejgq7wt57s",
#     "status": "SUCCEEDED",
#     "fee_sat": "2",
#     "fee_msat": "2016",
#     "creation_time_ns": "1743121999947725089",
#     "htlcs": [
#         {
#             "attempt_id": "1007",
#             "status": "SUCCEEDED",
#             "route": {
#                 "total_time_lock": 890041,
#                 "total_fees": "2",
#                 "total_amt": "13",
#                 "hops": [
#                     {
#                         "chan_id": "978052976336306177",
#                         "chan_capacity": "400000",
#                         "amt_to_forward": "12",
#                         "fee": "1",
#                         "expiry": 889897,
#                         "amt_to_forward_msat": "12011",
#                         "fee_msat": "1005",
#                         "pub_key": "03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f",
#                         "tlv_payload": true,
#                         "mpp_record": null,
#                         "amp_record": null,
#                         "custom_records": {},
#                         "metadata": "",
#                         "blinding_point": "",
#                         "encrypted_data": "",
#                         "total_amt_msat": "0"
#                     },
#                     {
#                         "chan_id": "870915463859994624",
#                         "chan_capacity": "50000000",
#                         "amt_to_forward": "11",
#                         "fee": "1",
#                         "expiry": 889817,
#                         "amt_to_forward_msat": "11000",
#                         "fee_msat": "1011",
#                         "pub_key": "028d98b9969fbed53784a36617eb489a59ab6dc9b9d77fcdca9ff55307cd98e3c4",
#                         "tlv_payload": true,
#                         "mpp_record": null,
#                         "amp_record": null,
#                         "custom_records": {},
#                         "metadata": "",
#                         "blinding_point": "",
#                         "encrypted_data": "",
#                         "total_amt_msat": "0"
#                     },
#                     {
#                         "chan_id": "955620740117757953",
#                         "chan_capacity": "50000000",
#                         "amt_to_forward": "11",
#                         "fee": "0",
#                         "expiry": 889775,
#                         "amt_to_forward_msat": "11000",
#                         "fee_msat": "0",
#                         "pub_key": "02e1221434a21b8ce5818e92c6ec76301824dc87ed94b4628242e4b1f4a6ff445f",
#                         "tlv_payload": true,
#                         "mpp_record": null,
#                         "amp_record": null,
#                         "custom_records": {},
#                         "metadata": "",
#                         "blinding_point": "",
#                         "encrypted_data": "",
#                         "total_amt_msat": "0"
#                     },
#                     {
#                         "chan_id": "619959631417311239",
#                         "chan_capacity": "11",
#                         "amt_to_forward": "11",
#                         "fee": "0",
#                         "expiry": 889775,
#                         "amt_to_forward_msat": "11000",
#                         "fee_msat": "0",
#                         "pub_key": "03e6f719ef300a2e268f89e1938ac487d3e1cacd50d28048c81744aaffc551d9f8",
#                         "tlv_payload": true,
#                         "mpp_record": {
#                             "payment_addr": "a47cf472fa3233cfad20a08c1c5ae78447841aa972644311b7e830ad1842a403",
#                             "total_amt_msat": "11000"
#                         },
#                         "amp_record": null,
#                         "custom_records": {},
#                         "metadata": "",
#                         "blinding_point": "",
#                         "encrypted_data": "",
#                         "total_amt_msat": "0"
#                     }
#                 ],
#                 "total_fees_msat": "2016",
#                 "total_amt_msat": "13016",
#                 "first_hop_amount_msat": "13016",
#                 "custom_channel_data": ""
#             },
#             "attempt_time_ns": "1743121999993817810",
#             "resolve_time_ns": "1743122000663135671",
#             "failure": null,
#             "preimage": "566ef7444a3371286edd6a47dfba660514a2e6f3a1b6e20f56f4c102399df398"
#         }
#     ],
#     "payment_index": "1021",
#     "failure_reason": "FAILURE_REASON_NONE",
#     "first_hop_custom_records": {}
# }
# root@generous-purpose:~/btcpayserver-docker# 