import { makeStyles } from '@material-ui/styles';

/**
 * CENTRALIZED COMPONENT STYLES - Consistent UI with minimal spacing
 * COLORS: Only 3 colors allowed
 * - Light Orange (#fbe9e7): User provided data/text (descriptions, item titles)
 * - Dark Orange (#d84315): Static/system texts
 * - Light Blue (#3899ef): Icons
 * FONT: Only FreePixel font
 * SPACING: Minimal padding/margins
 */
const useComponentStyles = makeStyles((theme) => ({
    
    // ===== CENTRALIZED FONT SYSTEM =====
    freePixelFont: {
        fontFamily: '"FreePixel", "Courier New", monospace !important'
    },
    
    // ===== CENTRALIZED COLOR CLASSES =====
    // User provided content (descriptions, titles) - Light Orange
    userText: {
        color: theme.appColors?.userText || theme.colors?.lightOrange || '#fbe9e7',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    userContent: {
        color: theme.appColors?.userContent || theme.colors?.lightOrange || '#fbe9e7',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // Static/system text - Dark Orange
    systemText: {
        color: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    staticText: {
        color: theme.appColors?.staticText || theme.colors?.darkOrange || '#d84315',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // Icons - Light Blue
    iconColor: {
        color: theme.appColors?.iconColor || theme.colors?.lightBlue || '#3899ef'
    },
    
    // ===== CENTRALIZED SPACING SYSTEM =====
    // Minimal spacing classes
    spaceXs: { margin: '2px', padding: '2px' },
    spaceSm: { margin: '4px', padding: '4px' },
    spaceMd: { margin: '8px', padding: '8px' },
    spaceLg: { margin: '12px', padding: '12px' },
    spaceXl: { margin: '16px', padding: '16px' },
    
    // Margin only
    marginXs: { margin: '2px' },
    marginSm: { margin: '4px' },
    marginMd: { margin: '8px' },
    marginLg: { margin: '12px' },
    marginXl: { margin: '16px' },
    
    // Padding only
    paddingXs: { padding: '2px' },
    paddingSm: { padding: '4px' },
    paddingMd: { padding: '8px' },
    paddingLg: { padding: '12px' },
    paddingXl: { padding: '16px' },
    
    // ===== LAYOUT COMPONENTS =====
    container: {
        fontFamily: '"FreePixel", "Courier New", monospace',
        padding: '8px',
        margin: '4px'
    },
    
    header: {
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    paper: {
        padding: '8px',
        margin: '4px',
        fontFamily: '"FreePixel", "Courier New", monospace',
        backgroundColor: '#000000',
        border: '1px solid #d84315',
        borderRadius: '0px'
    },
    
    gridItem: {
        padding: '4px',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // ===== TEXT COMPONENTS =====
    // User content text (descriptions, item titles) - Light Orange
    itemTitle: {
        color: theme.appColors?.userText || theme.colors?.lightOrange || '#fbe9e7',
        fontFamily: '"FreePixel", "Courier New", monospace',
        fontWeight: 'normal',
        marginBottom: '4px'
    },
    
    itemDescription: {
        color: theme.appColors?.userText || theme.colors?.lightOrange || '#fbe9e7',
        fontFamily: '"FreePixel", "Courier New", monospace',
        marginBottom: '4px'
    },
    
    // System/static text - Dark Orange
    sectionTitle: {
        color: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315',
        fontFamily: '"FreePixel", "Courier New", monospace',
        marginBottom: '8px',
        fontWeight: 'normal'
    },
    
    infoLabel: {
        color: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315',
        fontFamily: '"FreePixel", "Courier New", monospace',
        fontWeight: 'normal',
        marginRight: '4px'
    },
    
    infoValue: {
        color: theme.appColors?.userText || theme.colors?.lightOrange || '#fbe9e7',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // ===== FORM COMPONENTS =====
    formGroup: {
        marginBottom: '4px',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    formLabel: {
        color: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315',
        fontFamily: '"FreePixel", "Courier New", monospace',
        marginBottom: '4px',
        display: 'block'
    },
    
    formActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '8px',
        '& > *': {
            marginLeft: '4px',
            fontFamily: '"FreePixel", "Courier New", monospace'
        }
    },
    
    // ===== BUTTON COMPONENTS =====
    iconButton: {
        color: theme.appColors?.iconColor || theme.colors?.lightBlue || '#3899ef',
        padding: '4px',
        '& .MuiSvgIcon-root': {
            color: theme.colors?.lightBlue || '#3899ef'
        }
    },
    
    // ===== IMAGE COMPONENTS =====
    itemProfileImage: {
        maxWidth: '80px',
        maxHeight: '80px',
        objectFit: 'contain',
        border: `1px solid ${theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315'}`,
        borderRadius: '0px',
        margin: '2px'
    },
    
    imagePreview: {
        position: 'relative',
        width: '100px',
        height: '100px',
        overflow: 'hidden',
        borderRadius: '0px',
        border: `1px solid ${theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315'}`,
        margin: '2px'
    },
    
    // ===== NAVIGATION/PAGINATION =====
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        margin: '8px 0'
    },
    
    paginationButton: {
        fontFamily: '"FreePixel", "Courier New", monospace',
        color: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315',
        marginRight: '4px',
        border: `1px solid ${theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315'}`,
        borderRadius: '0px',
        padding: '4px 8px',
        minWidth: 'auto'
    },
    
    // ===== STATUS/FEEDBACK COMPONENTS =====
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px'
    },
    
    errorMessage: {
        padding: '8px',
        backgroundColor: theme.appColors?.paper || theme.colors?.paper || '#000000',
        color: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315',
        border: `1px solid ${theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315'}`,
        borderRadius: '0px',
        marginBottom: '4px',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    successMessage: {
        padding: '8px',
        backgroundColor: theme.appColors?.paper || theme.colors?.paper || '#000000',
        color: theme.appColors?.userText || theme.colors?.lightOrange || '#fbe9e7',
        border: `1px solid ${theme.appColors?.userText || theme.colors?.lightOrange || '#fbe9e7'}`,
        borderRadius: '0px',
        marginBottom: '4px',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    // ===== MINIMAL INVOICE/PAYMENT STYLES =====
    invoiceCard: {
        padding: '8px',
        margin: '4px',
        fontFamily: '"FreePixel", "Courier New", monospace',
        backgroundColor: theme.appColors?.paper || theme.colors?.paper || '#000000',
        border: `1px solid ${theme.colors?.darkOrange || '#d84315'}`
    },
    
    invoiceTitle: {
        color: theme.appColors?.userText || theme.colors?.lightOrange || '#fbe9e7',
        fontFamily: '"FreePixel", "Courier New", monospace',
        marginBottom: '4px'
    },
    
    invoiceAmount: {
        color: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315',
        fontFamily: '"FreePixel", "Courier New", monospace',
        fontWeight: 'normal'
    },
    
    // ===== UTILITY CLASSES =====
    noResults: {
        textAlign: 'center',
        padding: '8px',
        color: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315',
        fontFamily: '"FreePixel", "Courier New", monospace'
    },
    
    divider: {
        margin: '4px 0',
        borderColor: theme.appColors?.systemText || theme.colors?.darkOrange || '#d84315'
    },
    
    // Remove all excess spacing for new components
    minimalSpacing: {
        padding: '2px !important',
        margin: '2px !important',
        '& .MuiCardContent-root': {
            padding: '4px !important'
        },
        '& .MuiDialogContent-root': {
            padding: '8px !important'
        },
        '& .MuiBox-root': {
            padding: '2px !important',
            margin: '2px !important'
        }
    },
    
    // ===== CONSISTENT UI COMPONENTS =====
    // Standard section header
    sectionHeader: {
        color: '#d84315', // Dark Orange for system text
        fontFamily: '"FreePixel", "Courier New", monospace',
        fontSize: '1rem',
        marginBottom: '8px',
        padding: '4px 0',
        textAlign: 'left',
        display: 'block',
        width: '100%'
    },
    
    // File listing container with proper alignment
    fileListContainer: {
        padding: '4px',
        margin: '0',
        width: '100%',
        backgroundColor: '#000000',
        border: '1px solid #d84315',
        borderRadius: '0px'
    },
    
    // Individual file item with consistent styling
    fileItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px',
        margin: '2px 0',
        backgroundColor: '#000000',
        border: '1px solid #d84315',
        borderRadius: '0px',
        width: '100%'
    },
    
    // Consistent component wrapper
    componentWrapper: {
        backgroundColor: '#000000',
        border: '1px solid #d84315',
        borderRadius: '0px',
        padding: '4px',
        margin: '2px',
        fontFamily: '"FreePixel", "Courier New", monospace'
    }
}));

export default useComponentStyles;