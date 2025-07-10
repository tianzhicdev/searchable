import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { useTheme } from '@material-ui/core/styles';
import { Card, CardContent, CardHeader, Divider, Typography } from '@material-ui/core';

// project imports
import { componentSpacing } from '../../utils/spacing';

//-----------------------|| CUSTOM SUB CARD ||-----------------------//

const SubCard = ({ children, content, contentClass, darkTitle, secondary, sx = {}, title, ...others }) => {
    const theme = useTheme();

    return (
        <Card
            sx={{
                border: '1px solid',
                borderColor: theme.palette.primary.light,
                ':hover': {
                    boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)'
                },
                ...sx
            }}
            {...others}
        >
            {/* card header and action */}
            {!darkTitle && title && <CardHeader sx={componentSpacing.card(theme)} title={<Typography variant="h5">{title}</Typography>} action={secondary} />}
            {darkTitle && title && <CardHeader sx={componentSpacing.card(theme)} title={<Typography variant="h4">{title}</Typography>} action={secondary} />}

            {/* content & header divider */}
            {title && (
                <Divider
                    sx={{
                        opacity: 1,
                        borderColor: theme.palette.primary.light
                    }}
                />
            )}

            {/* card content */}
            {content && (
                <CardContent sx={componentSpacing.card(theme)} className={contentClass}>
                    {children}
                </CardContent>
            )}
            {!content && children}
        </Card>
    );
};

SubCard.propTypes = {
    children: PropTypes.node,
    content: PropTypes.bool,
    contentClass: PropTypes.string,
    darkTitle: PropTypes.bool,
    secondary: PropTypes.oneOfType([PropTypes.node, PropTypes.string, PropTypes.object]),
    sx: PropTypes.object,
    title: PropTypes.oneOfType([PropTypes.node, PropTypes.string, PropTypes.object])
};

SubCard.defaultProps = {
    content: true
};

export default SubCard;
