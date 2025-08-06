CREATE TABLE `stock_prices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`time` text NOT NULL,
	`symbol` text NOT NULL,
	`price` real NOT NULL,
	`change_amount` real NOT NULL,
	`change_percent` real
);
--> statement-breakpoint
CREATE TABLE `stock_purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tx_hash` text,
	`hedera_tx_id` text,
	`user_wallet` text NOT NULL,
	`stock_symbol` text NOT NULL,
	`name` text NOT NULL,
	`amount_shares` integer NOT NULL,
	`buy_price` real NOT NULL,
	`buy_price_hbar` real,
	`purchase_date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`transaction_type` text DEFAULT 'buy' NOT NULL,
	`paystack_id` text,
	`network` text DEFAULT 'hedera-testnet' NOT NULL,
	`gas_fee` real
);
--> statement-breakpoint
CREATE TABLE `stocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`total_shares` integer NOT NULL,
	`token_id` text NOT NULL,
	`chain` text NOT NULL,
	`exchange` text NOT NULL,
	`sector` text NOT NULL,
	`market_cap` integer,
	`hedera_token_address` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_updated` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stocks_symbol_unique` ON `stocks` (`symbol`);--> statement-breakpoint
CREATE TABLE `user_stocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_address` text NOT NULL,
	`stock_symbol` text NOT NULL,
	`number_stocks` integer NOT NULL,
	`token_id` text NOT NULL
);
