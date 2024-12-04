import { useSelector } from 'react-redux';
import {
    selectMessageHistory,
} from '../../stores';
import { StaticMessage } from './StaticMessage';

export const INTRO_MESSAGE = `Hey I'm Kava AI. You can ask me any question. If you're here for the #KavaAI Launch Competition, try asking a question like "I want to deploy a memecoin on Kava with cool tokenomics".`;

export const Messages = () => {
    const history = useSelector(selectMessageHistory);

    return <>
        <StaticMessage role='assistant' content={INTRO_MESSAGE} />
        {
            history.map((msg, i) => {
                if (msg.role === 'assistant' || msg.role === 'user') {
                    return <StaticMessage key={i} role={msg.role} content={msg.content as string} />
                } else {
                    return null;
                }
            })
        }
    </>
};

