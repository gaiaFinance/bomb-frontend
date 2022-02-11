import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Container, Grid, Typography, Link} from '@material-ui/core';

import {ReactComponent as IconTelegram} from '../../assets/img/telegram.svg';
import {ReactComponent as IconTwitter} from '../../assets/img/twitter.svg';
import {ReactComponent as IconGithub} from '../../assets/img/github.svg';
import {ReactComponent as IconDiscord} from '../../assets/img/discord.svg';

const useStyles = makeStyles((theme) => ({
  footer: {
    position: 'absolute',
    bottom: '0',
    paddingTop: '20px',
    paddingBottom: '20px',
    width: '100%',
    color: 'white',
    backgroundColor: '#191b26',
    textAlign: 'center',
    height: '1.3rem',
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  link: {
    width: '24px',
    height: '24px',
    display: 'inline',
    marginLeft: '20px',
  },

  img: {
    width: '24px',
    height: '24px',
  },
}));

const Footer = () => {
  const classes = useStyles();
  return (
    <footer className={classes.footer}>
      <Container maxWidth="lg">
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div item xs={6}>
            <Typography variant="body2" color="textPrimary" align="left">
              {'Copyright © '}
              <Link color="inherit" href="/">
                Gaia Finance
              </Link>{' '}
              {new Date().getFullYear()},
              All rights reserved
            </Typography>
          </div>
          <div style={{textAlign: 'right', height: '20px', display: 'flex'}}>
            <a
              href="https://twitter.com/BombMoneyBSC"
              rel="noopener noreferrer"
              target="_blank"
              className={classes.link}
            >
              <IconTwitter style={{fill: '#dddfee'}} />
            </a>
            <a href="https://github.com/gaiaFinance/gaia-frontend" rel="noopener noreferrer" target="_blank" className={classes.link}>
              <IconGithub style={{fill: '#dddfee', height: '20px'}} />
            </a>
            <a href="https://t.me/bombmoneybsc" rel="noopener noreferrer" target="_blank" className={classes.link}>
              <IconTelegram style={{fill: '#dddfee', height: '20px'}} />
            </a>
            <a href="http://discord.bomb.money/" rel="noopener noreferrer" target="_blank" className={classes.link}>
              <IconDiscord style={{fill: '#dddfee', height: '20px'}} />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
