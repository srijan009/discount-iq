type Message = {
  message: string
}
export default function SuccessBanner( { message }: Message) {
  return (
    <div className="success-banner">
      <p>{message}</p>
    </div>
  )
}