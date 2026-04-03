import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

type BaselineDocDialog = {
  open: boolean;
  onClose: () => void;
};
export const BaselineDocDialog = ({ open, onClose }: BaselineDocDialog) => (
  <Dialog
    open={open}
    onClose={onClose}
    scroll="paper"
    aria-labelledby="scroll-dialog-title"
    aria-describedby="scroll-dialog-description"
  >
    <DialogTitle id="scroll-dialog-title">Baseline Species</DialogTitle>
    <IconButton
      aria-label="close"
      onClick={onClose}
      sx={(theme) => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: theme.palette.grey[500],
      })}
    >
      <CloseIcon />
    </IconButton>
    <DialogContent dividers={true} sx={{ paddingTop: 0 }}>
      <DialogContentText id="scroll-dialog-description" tabIndex={-1}>
        <p>
          This page lets you provide a list of species that you know are in the region, but don't have any observations
          on iNaturalist yet. These species will supplement actual observations
        </p>
        <p>
          <b>You don't need to use this feature</b>. This is only needed when you have prior knowledge of the species in
          your region and iNat is missing those species.
        </p>
        <p>
          <b>Tip:</b> keep the list as short as possible. Only add species that don't have actual iNat observations - or
          have very few. Technically, iNat users can delete their own observations so if a species has very few.
        </p>
        <p>
          The reason that you want to keep this list short is because this area requires maintenance. Taxonomies change
          over time and this system can't automatically recognize every scenario, such as certain taxon splits. For
          example, you could one day add a species here that gets split.
        </p>
        <p>
          We suggest making use of the feature to auto-remove species from the list, once the number of curator reviews
          meets a certain threshold. That provides it with padding in case a user deleted an observation (unlikely)
        </p>
      </DialogContentText>
    </DialogContent>
  </Dialog>
);
