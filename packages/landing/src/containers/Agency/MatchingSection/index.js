import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cloudbase from '@cloudbase/js-sdk';
import { WsProvider, ApiPromise } from '@polkadot/api';
import { InputNumber, notification } from 'antd';
import Box from 'common/components/Box';
import Button from 'common/components/Button';
import Container from 'common/components/UI/Container';
import MatchingWrapper from './matchingSection.style';
import { PolkadotContext } from 'common/contexts/PolkadotContext';
import { Spin } from 'antd';
import qfConfig from '../../../quadraticFunding/config';
import config from '../../../config';
import { unitToNumber } from 'common/utils';


const { oak } = config;

const MatchingSection = ({ row, col, rid, account, onVote }) => {
  const polkadotContext = useContext(PolkadotContext);

  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState({});
  const [projectDetail, setProjectDetail] = useState({});
  const [contributions, setContributions] = useState([]);
  const [totalMatching, setTotalMatching] = useState(0);
  const [voteAmount, setVoteAmount] = useState(10);
  const [isVoting, setIsVoting] = useState(false);

  const getMatchingFund = (matching) => {
    const fund = _.isEmpty(round) ? 0 : unitToNumber(round.matching_fund);
    return totalMatching ? ((matching / totalMatching) * fund).toFixed(4) : 0;
  };

  useEffect(() => {
    if (!_.isEmpty(polkadotContext)) {
      setLoading(false);
      setRound(polkadotContext.rounds[rid] || {});
      setProjectDetail(polkadotContext.projectDetail || {});

      const newContributions = [];
      _.forEach(polkadotContext.projectDetail.contributions, (item, index) => {
        newContributions.push({ ...item, index });
      });
      setContributions(newContributions);
    }
  }, [
    polkadotContext.projectDetail,
    polkadotContext.projectDetail.contributions,
  ]);

  useEffect(() => {
    let totalMatchingAmount = 0;
    _.forEach(round.grants, (item) => {
      totalMatchingAmount += item.matching;
    });

    setTotalMatching(totalMatchingAmount);
  }, [contributions]);

  const onParticipateClicked = async () => {
    setIsVoting(true);
    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const { endpoint, types } = qfConfig;

      const wsProvider = new WsProvider(endpoint);
      const api = await ApiPromise.create({
        provider: wsProvider,
        types,
      });

      const injector = await web3FromAddress(account);
      const projectIndex = parseInt(polkadotContext.projectDetail.project_index);
      const roundIndex = parseInt(rid);

      const extrinsic = api.tx.quadraticFunding.contribute(projectIndex, voteAmount * 10**10);
      extrinsic.signAndSend(account, { signer: injector.signer }, async (status) => { 
        if (!status.isFinalized) {
          return;
        }

        const app = cloudbase.init({
          env: 'quadratic-funding-1edc914e16f235',
          region: 'ap-guangzhou'
        });

        await app.callFunction({
          name: 'vote',
          data: {
            address: account,
            roundIndex,
            projectIndex,
            amount: voteAmount,
          }
        });

        notification.open({
          message: 'Vote successfully!',
          description: `Your ${voteAmount} OAK vote has been successful. Thanks!`
        });

        setIsVoting(false);
        onVote();
      });
    } catch (error) {
      console.log('onParticipateClicked, error: ', error);
      setIsVoting(false);
      notification.open({
        message: 'Vote failed!',
        description: `Your ${voteAmount} OAK vote has been failed!`
      });
      return;
    }
  }

  const totalContributionValue = _.reduce(contributions, (prev, contribution) => {
    return prev + unitToNumber(contribution.value);
  }, 0);

  return (
    <MatchingWrapper>
      <Container>
        {loading ? (
          <Spin size="large" />
        ) : (
          <Box className="row" {...row}>
            <Box className="col" {...col}>
              <div className="block matcing">
                <div className="count-down">
                  <span className="title">Project {projectDetail.name}</span>
                  <span className="count-down-text">
                    {projectDetail.description}
                  </span>
                </div>
                <div className="contribute-info">
                  <div className="contribute">
                    <span>+ {totalContributionValue.toFixed(3)} {oak.symbol} contribution from {contributions.length} contributors</span>
                  </div>
                </div>
                <span>+ {getMatchingFund(projectDetail.matching)} {oak.symbol} match</span>
                <div className="participate">
                  <div style={{ height: 48, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }} >
                    <InputNumber size='large' min={1} max={9999} defaultValue={10} value={voteAmount} onChange={(value)=> {
                      setVoteAmount(value);
                    }} />
                    <span style={{ marginLeft: 5}}>OAK</span>
                  </div>
                  <Button isLoading={isVoting} style={{ marginLeft: 20 }} title="Participate" onClick={onParticipateClicked} />
                </div>
              </div>
            </Box>

            <Box className="col" {...col}>
              <div className="block">
                <div className="carousell">
                  <span>Carousell</span>
                </div>
              </div>
            </Box>
          </Box>
        )}
      </Container>
    </MatchingWrapper>
  );
};

MatchingSection.propTypes = {
  title: PropTypes.object,
  btnStyle: PropTypes.object,
  description: PropTypes.object,
  contentStyle: PropTypes.object,
  discountText: PropTypes.object,
  discountAmount: PropTypes.object,
  outlineBtnStyle: PropTypes.object,
};

MatchingSection.defaultProps = {
  row: {
    flexBox: true,
    flexWrap: 'wrap',
    ml: '-15px',
    mr: '-15px',
    alignItems: 'center',
  },
  col: {
    pr: '15px',
    pl: '15px',
    width: ['100%', '70%', '60%', '50%'],
  },
  title: {
    fontSize: ['26px', '34px', '42px', '55px'],
    fontWeight: '300',
    color: '#0f2137',
    letterSpacing: '-0.025em',
    mb: ['20px', '25px'],
    lineHeight: '1.31',
  },
  description: {
    fontSize: '16px',
    color: '#343d48cc',
    lineHeight: '2.1',
    mb: '0',
  },
  btnStyle: {
    minWidth: ['120px', '156px'],
    fontSize: '14px',
    fontWeight: '500',
  },
  outlineBtnStyle: {
    minWidth: ['130px', '156px'],
    fontSize: '14px',
    fontWeight: '500',
    color: '#0f2137',
    p: '5px 10px',
  },
  discountAmount: {
    fontSize: '14px',
    color: '#10AC84',
    mb: 0,
    as: 'span',
    mr: '0.4em',
  },
  discountText: {
    fontSize: '14px',
    color: '#0f2137',
    mb: 0,
    as: 'span',
  },
};

const mapStateToProps = (state) => ({
  account: state.account,
});

export default connect(mapStateToProps)(MatchingSection);
