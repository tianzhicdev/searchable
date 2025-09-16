"""
Pure business logic for invoice calculations
This module contains the core calculation logic separated from logging and database dependencies
"""

from decimal import Decimal, ROUND_HALF_UP, InvalidOperation

TWOPLACES = Decimal("0.01")

def _to_money(x, field):
    try:
        return Decimal(str(x))
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError(f"Invalid money value for {field}")

def _round2(x: Decimal) -> Decimal:
    return x.quantize(TWOPLACES, rounding=ROUND_HALF_UP)

def calc_invoice_core(searchable_data, selections):
    try:
        if not searchable_data or not isinstance(searchable_data, dict):
            raise ValueError("Invalid searchable data")

        # ------ Input normalization & validation ------
        selections = selections or []  # treat None as empty
        if not isinstance(selections, list):
            raise ValueError("Selections must be a list")

        # Validate counts and any direct amounts (reject negatives and non-int counts)
        norm_selections = []
        for sel in selections:
            cnt = sel.get("count", 1)
            if not isinstance(cnt, int):
                raise ValueError("count must be an integer")
            if cnt < 0:
                raise ValueError("count must be >= 0")

            if "amount" in sel and sel["amount"] is not None:
                amt = _to_money(sel["amount"], "selection.amount")
                if amt < 0:
                    raise ValueError("selection.amount must be >= 0")
                sel = dict(sel)
                sel["amount"] = amt
            sel = dict(sel)
            sel["count"] = cnt
            norm_selections.append(sel)
        selections = norm_selections
        # ---------------------------------------------

        public = (searchable_data.get("payloads") or {}).get("public") or {}
        stype = public.get("type", "downloadable")

        # allinone passthrough (kept as-is)
        if stype == "allinone":
            return calc_allinone_invoice(public, selections)

        # -------- direct payments --------
        if stype == "direct":
            total = Decimal("0")
            total_cnt = 0
            for sel in selections:
                if sel.get("type") == "direct" and sel.get("amount") is not None:
                    total += sel["amount"] * sel["count"]
                    total_cnt += sel["count"]
            total = _round2(total)
            title = public.get("title", "Direct Payment Item")
            return {
                "amount_usd": float(total),
                "total_amount_usd": float(total),
                "description": f"{title} - Direct Payment",
                "currency": "usd",
                "total_item_count": total_cnt
            }

        # -------- catalog items (downloadable/offline) --------
        downloadable = public.get("downloadableFiles") or []
        offline = public.get("offlineItems") or []

        price_by_id = {}
        for f in downloadable:
            p = _to_money(f.get("price"), "downloadableFiles[].price")
            if p < 0:
                raise ValueError("downloadableFiles[].price must be >= 0")
            price_by_id[f.get("fileId")] = p

        for it in offline:
            p = _to_money(it.get("price"), "offlineItems[].price")
            if p < 0:
                raise ValueError("offlineItems[].price must be >= 0")
            price_by_id[it.get("itemId")] = p

        total = Decimal("0")
        total_cnt = 0
        for sel in selections:
            sid = sel.get("id")
            if sid in price_by_id:
                total += price_by_id[sid] * sel["count"]
                total_cnt += sel["count"]

        total = _round2(total)
        title = public.get("title", "Item")
        desc = title if total_cnt <= 1 else f"{title} (x{total_cnt} items)"

        return {
            "amount_usd": float(total),
            "total_amount_usd": float(total),
            "description": desc,
            "currency": "usd",
            "total_item_count": total_cnt
        }

    except Exception as e:
        raise ValueError("Invalid searchable data or selections") from e


def calc_allinone_invoice(public_data, selections):
    """
    Calculate invoice for allinone type that combines downloadable, offline, and donation components
    
    Args:
        public_data: Public data from searchable containing components
        selections: List of selected items with component-specific selections
        
    Returns:
        dict: Invoice calculation results
    """
    components = public_data.get('components', {})
    title = public_data.get('title', 'AllInOne Item')
    
    total_amount_usd = 0.0
    descriptions = []
    total_item_count = 0
    
    # Process downloadable component if enabled
    downloadable_comp = components.get('downloadable', {})
    if downloadable_comp.get('enabled'):
        files = downloadable_comp.get('files', [])
        # Build file id to price mapping
        file_id_to_price = {f.get('fileId'): float(f.get('price', 0)) for f in files}
        
        # Process selected downloadable files
        downloadable_selections = selections if isinstance(selections, list) else []
        for sel in downloadable_selections:
            if sel.get('component') == 'downloadable' and sel.get('id'):
                price = file_id_to_price.get(sel.get('id'), 0)
                count = sel.get('count', 1)
                total_amount_usd += price * count
                total_item_count += count
                # Find file name for description
                file_name = next((f.get('name', 'File') for f in files if f.get('fileId') == sel.get('id')), 'File')
                if count > 1:
                    descriptions.append(f"{file_name} (x{count})")
                else:
                    descriptions.append(file_name)
    
    # Process offline component if enabled
    offline_comp = components.get('offline', {})
    if offline_comp.get('enabled'):
        items = offline_comp.get('items', [])
        # Build item id to price mapping
        item_id_to_price = {i.get('id'): float(i.get('price', 0)) for i in items}
        
        # Process selected offline items
        offline_selections = selections if isinstance(selections, list) else []
        for sel in offline_selections:
            if sel.get('component') == 'offline' and sel.get('id'):
                price = item_id_to_price.get(sel.get('id'), 0)
                count = sel.get('count', 1)
                total_amount_usd += price * count
                total_item_count += count
                # Find item name for description
                item_name = next((i.get('name', 'Item') for i in items if i.get('id') == sel.get('id')), 'Item')
                if count > 1:
                    descriptions.append(f"{item_name} (x{count})")
                else:
                    descriptions.append(item_name)
    
    # Process donation component if enabled
    donation_comp = components.get('donation', {})
    if donation_comp.get('enabled'):
        # Process donation amount from selections
        donation_selections = selections if isinstance(selections, list) else []
        for sel in donation_selections:
            if sel.get('component') == 'donation' and sel.get('amount'):
                amount = float(sel.get('amount'))
                total_amount_usd += amount
                total_item_count += 1
                descriptions.append(f"Donation: ${amount:.2f}")
    
    total_amount_usd = round(total_amount_usd, 2)
    
    # Generate final description
    if descriptions:
        description = f"{title} - {'; '.join(descriptions)}"
    else:
        description = title
    
    return {
        "amount_usd": total_amount_usd,
        "total_amount_usd": total_amount_usd,
        "description": description,
        "currency": "usd",
        "total_item_count": total_item_count
    }