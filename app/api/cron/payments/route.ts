import { prisma } from "@/lib/prisma";import { expirePayments } from "@/lib/payments";
export async function GET(request:Request){if(!process.env.CRON_SECRET||request.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return Response.json({error:"Unauthorized"},{status:401});await prisma.$transaction(tx=>expirePayments(tx));return Response.json({success:true});}
