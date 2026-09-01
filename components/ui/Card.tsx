import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
}

export function Card({ as = 'div', className = '', children, ...rest }: CardProps) {
  const Tag = as as 'div';
  return (
    <Tag className={['card', className].join(' ')} {...rest}>
      {children}
    </Tag>
  );
}

export function CardBody({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['p-4', className].join(' ')} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['p-4 border-b border-gray-100', className].join(' ')} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['p-4 border-t border-gray-100 bg-gray-50', className].join(' ')} {...rest}>
      {children}
    </div>
  );
}

export default Card;