import { Icon, Text } from '@shopify/polaris';
import {
    AlertCircleIcon,
} from '@shopify/polaris-icons';
import { ValidationMessage } from 'app/types/type';

export default function CustomValidationMessage({ message }: ValidationMessage) {
    return (
        <div className="custom-validation-msg">
            <div className="icon-wrapper">
                <Icon source={AlertCircleIcon} tone="critical" />
            </div>
            <Text as="p" tone="critical">{message}</Text>
        </div>
    )
}