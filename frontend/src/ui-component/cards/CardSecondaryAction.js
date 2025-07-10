import PropTypes from 'prop-types';
import React from 'react';

// material-ui
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core/styles';
import { ButtonBase, Link, Tooltip, useMediaQuery } from '@material-ui/core';

// project imports
import Avatar from './../extended/Avatar';
import { touchTargets } from '../../utils/spacing';

const useStyles = makeStyles((theme) => ({
    buttonBase: {
        minWidth: touchTargets.minWidth,
        minHeight: touchTargets.minHeight,
        padding: theme.spacing(0.5),
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        [theme.breakpoints.down('sm')]: {
            minWidth: touchTargets.minWidth - 8,
            minHeight: touchTargets.minHeight - 8,
        }
    }
}));

//-----------------------|| CARD SECONDARY ACTION ||-----------------------//

const CardSecondaryAction = ({ title, link, icon }) => {
    const theme = useTheme();
    const classes = useStyles();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Tooltip title={title ? title : 'Reference'} placement={isMobile ? 'bottom' : 'left'}>
            <ButtonBase disableRipple className={classes.buttonBase}>
                {!icon && (
                    <Avatar component={Link} href={link} target="_blank" alt="MUI Logo" size="badge" color="primary" outline>
                        <svg width="500" height="500" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0)">
                                <path
                                    d="M100 260.9V131L212.5 195.95V239.25L137.5 195.95V282.55L100 260.9Z"
                                    fill={theme.palette.primary[800]}
                                />
                                <path
                                    d="M212.5 195.95L325 131V260.9L250 304.2L212.5 282.55L287.5 239.25V195.95L212.5 239.25V195.95Z"
                                    fill={theme.palette.primary.main}
                                />
                                <path d="M212.5 282.55V325.85L287.5 369.15V325.85L212.5 282.55Z" fill={theme.palette.primary[800]} />
                                <path
                                    d="M287.5 369.15L400 304.2V217.6L362.5 239.25V282.55L287.5 325.85V369.15ZM362.5 195.95V152.65L400 131V174.3L362.5 195.95Z"
                                    fill={theme.palette.primary.main}
                                />
                            </g>
                            <defs>
                                <clipPath id="clip0">
                                    <rect width="300" height="238.3" fill="white" transform="translate(100 131)" />
                                </clipPath>
                            </defs>
                        </svg>
                    </Avatar>
                )}
                {icon && (
                    <Avatar component={Link} href={link} target="_blank" size="badge" color="primary" outline>
                        {icon}
                    </Avatar>
                )}
            </ButtonBase>
        </Tooltip>
    );
};

CardSecondaryAction.propTypes = {
    icon: PropTypes.node,
    link: PropTypes.string,
    title: PropTypes.string
};

export default CardSecondaryAction;
