import { SaveBar } from '@shopify/app-bridge-react';
export default function  AppSaveBar() {
  const handleSave = () => {
    //console.log('Saving');
    shopify.saveBar.hide('discount-save-bar');
  };

  const handleDiscard = () => {
    //console.log('Discarding');
    shopify.saveBar.hide('discount-save-bar');
  };
  return (
    <>
      <SaveBar id="discount-save-bar">
        <button variant="primary" onClick={handleSave}></button>
        <button onClick={handleDiscard}></button>
      </SaveBar>
    </>
  );

}