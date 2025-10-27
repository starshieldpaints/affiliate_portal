terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  backend "s3" {
    bucket = "starshield-terraform-state"
    key    = "affiliate-portal/global.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  project = "starshield-affiliate"
}

module "network" {
  source = "./modules/network"
  project = local.project
  cidr_block = var.vpc_cidr
}
